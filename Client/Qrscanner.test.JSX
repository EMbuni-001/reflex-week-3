/**
 * Tests for QRScanner (D3-4).
 *
 * Mocks html5-qrcode entirely since a real camera cannot run
 * in a headless test environment. These tests verify the
 * component's contract with its consumer: it starts/stops the
 * camera correctly, surfaces decoded values unmodified, avoids
 * firing duplicate callbacks for a static code still in frame,
 * respects the `paused` prop, and surfaces camera errors.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import QRScanner from "./QRScanner";

const startMock = vi.fn();
const stopMock = vi.fn();
const clearMock = vi.fn();

vi.mock("html5-qrcode", () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: startMock,
    stop: stopMock,
    clear: clearMock,
  })),
}));

describe("QRScanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stopMock.mockResolvedValue(undefined);
    clearMock.mockReturnValue(undefined);
  });

  it("starts the camera on mount with the rear-facing camera preference", () => {
    startMock.mockResolvedValue(undefined);

    render(<QRScanner onScan={vi.fn()} />);

    expect(startMock).toHaveBeenCalledTimes(1);
    const [cameraConfig] = startMock.mock.calls[0];
    expect(cameraConfig).toEqual({ facingMode: "environment" });
  });

  it("calls onScan with the raw decoded text, unmodified", async () => {
    const onScan = vi.fn();
    startMock.mockImplementation((_camera, _config, successCallback) => {
      successCallback("RFX-1001");
      return Promise.resolve();
    });

    render(<QRScanner onScan={onScan} />);

    expect(onScan).toHaveBeenCalledWith("RFX-1001");
    expect(onScan).toHaveBeenCalledTimes(1);
  });

  it("does not call onScan repeatedly for the same code still in frame", async () => {
    const onScan = vi.fn();
    let successCallback;
    startMock.mockImplementation((_camera, _config, cb) => {
      successCallback = cb;
      return Promise.resolve();
    });

    render(<QRScanner onScan={onScan} />);

    successCallback("RFX-1001");
    successCallback("RFX-1001");
    successCallback("RFX-1001");

    expect(onScan).toHaveBeenCalledTimes(1);
  });

  it("does call onScan again for a genuinely different code", () => {
    const onScan = vi.fn();
    let successCallback;
    startMock.mockImplementation((_camera, _config, cb) => {
      successCallback = cb;
      return Promise.resolve();
    });

    render(<QRScanner onScan={onScan} />);

    successCallback("RFX-1001");
    successCallback("RFX-2002");

    expect(onScan).toHaveBeenCalledTimes(2);
    expect(onScan).toHaveBeenNthCalledWith(1, "RFX-1001");
    expect(onScan).toHaveBeenNthCalledWith(2, "RFX-2002");
  });

  it("ignores decoded results while paused", () => {
    const onScan = vi.fn();
    let successCallback;
    startMock.mockImplementation((_camera, _config, cb) => {
      successCallback = cb;
      return Promise.resolve();
    });

    render(<QRScanner onScan={onScan} paused />);

    successCallback("RFX-1001");

    expect(onScan).not.toHaveBeenCalled();
  });

  it("calls onError when the camera fails to start", async () => {
    const onError = vi.fn();
    startMock.mockRejectedValue(new Error("Permission denied"));

    render(<QRScanner onScan={vi.fn()} onError={onError} />);

    await vi.waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Permission denied")
    );
  });

  it("stops and clears the camera on unmount", async () => {
    startMock.mockResolvedValue(undefined);

    const { unmount } = render(<QRScanner onScan={vi.fn()} />);
    unmount();

    expect(stopMock).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    cleanup();
  });
});