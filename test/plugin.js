const expect = require('expect');
const proxyquire = require('proxyquire');

const ContextMock = require('./mocks/context');
const GitHubMock = require('./mocks/github');
const RobotMock = require('./mocks/robot');

function arrange(handleEventSpy) {
  const Plugin = proxyquire('../lib/plugin', {
    './handle-event': handleEventSpy
  });
  return {
    plugin: new Plugin(),
    robotMock: new RobotMock(new GitHubMock()),
    contextMock: new ContextMock()
  };
}

describe('plugin', () => {
  it('should load correctly', async () => {
    // Arrange
    const handleEventSpy = expect.createSpy();
    const { plugin, robotMock, contextMock } = arrange(handleEventSpy);

    // Act
    plugin.load(robotMock);
    await plugin.acceptEvent(contextMock);

    // Assert
    expect(handleEventSpy).toHaveBeenCalledWith(robotMock, contextMock);
  });

  it('should emit event-handled event when event is handled successfully', async () => {
    // Arrange
    const { plugin, robotMock, contextMock } = arrange(expect.createSpy());

    plugin.load(robotMock);

    const finishedEventSpy = expect.createSpy();
    plugin.on('event-handled', finishedEventSpy);

    // Act
    await plugin.acceptEvent(contextMock);

    // Assert
    expect(finishedEventSpy).toHaveBeenCalled();
  });

  it('should emit error event when event handler fails', async () => {
    // Arrange
    const handleEventSpy = expect.createSpy().andThrow(new Error('Something happened'));
    const { plugin, robotMock, contextMock } = arrange(handleEventSpy);

    plugin.load(robotMock);

    const errorEventSpy = expect.createSpy();
    plugin.on('error', errorEventSpy);

    // Act
    await plugin.acceptEvent(contextMock);

    // Assert
    expect(errorEventSpy).toHaveBeenCalled();
  });

  it('should emit error event if loaded more than once', () => {
    // Arrange
    const { plugin, robotMock } = arrange(expect.createSpy());

    const errorEventSpy = expect.createSpy();
    plugin.on('error', errorEventSpy);

    // Act
    plugin.load(robotMock);
    plugin.load(robotMock);

    // Assert
    expect(errorEventSpy).toHaveBeenCalled();
  });

  it('should emmit error event if events are given before loading', async () => {
    // Arrange
    const { plugin, contextMock } = arrange(expect.createSpy());

    const errorEventSpy = expect.createSpy();
    plugin.on('error', errorEventSpy);

    // Act
    await plugin.acceptEvent(contextMock);

    // Assert
    expect(errorEventSpy).toHaveBeenCalled();
  });

  it('should throw if `load` is called with incorrect execution context', () => {
    // Arrange
    const { plugin, robotMock } = arrange(expect.createSpy());

    // Act, Assert
    expect(() => plugin.load.call(undefined, robotMock))
      .toThrow('Unexpected execution context for method call');
  });

  it('should throw if `acceptEvent` is called with incorrect execution context', async () => {
    // Arrange
    const { plugin, robotMock, contextMock } = arrange(expect.createSpy());

    const errorEventSpy = expect.createSpy();
    plugin.on('error', errorEventSpy);

    plugin.load(robotMock);

    // Act, Assert
    try {
      await plugin.acceptEvent.call(contextMock);
    } catch (err) {
      expect(err.message).toBe('Unexpected execution context for method call');
      return;
    }

    throw new Error('Expected `acceptEvent` to throw');
  });
});
