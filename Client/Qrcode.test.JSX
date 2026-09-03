/**
 * Tests for QRCode (D3-3).
 *
 * Mocks the `qrcode` library so these tests don't depend on
 * actual image generation, and instead verify:
 *   1. the component calls the library with the EXACT value
 *      passed in, with no hidden wrapping/transformation
 *      (this is the important guarantee, since the payload
 *      format is a documented-but-not-locked decision — see
 *      QRCode.jsx header),
 *   2. it renders the resulting image,
 *   3. it handles missing values and generation errors
 *      without crashing.
 *
 * NOTE ON THE TASK'S "SCAN WITH A REAL READER" TESTING STEP:
 * The task's acceptance testing says "generate a QR, scan it
 * with a QR-reading app to confirm the payload matches the
 * agreed format." That is a manual, physical-device test that
 * cannot be automated or performed in this sandbox (no camera,
 * no network to render a real page). It's called out
 * explicitly in the summary below as an outstanding manual
 * step for you to perform.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import QRCode from "./QRCode";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

import QRCodeLib from "qrcode";

describe("QRCode", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows a 'no code available' state when value is missing", () => {
    render(<QRCode value="" />);
    expect(screen.getByTestId("qrcode-missing")).toBeInTheDocument();
    expect(QRCodeLib.toDataURL).not.toHaveBeenCalled();
  });

  it("shows a loading state while generation is in progress", () => {
    QRCodeLib.toDataURL.mockReturnValue(new Promise(() => {})); // never resolves

    render(<QRCode value="RFX-1001" />);

    expect(screen.getByTestId("qrcode-loading")).toBeInTheDocument();
  });

  it("calls the QR library with the exact string passed in, with no transformation", async () => {
    QRCodeLib.toDataURL.mockResolvedValue("data:image/png;base64,fake");

    render(<QRCode value="RFX-1001" />);

    await waitFor(() =>
      expect(QRCodeLib.toDataURL).toHaveBeenCalledWith(
        "RFX-1001",
        expect.objectContaining({ width: 200 })
      )
    );
  });

  it("renders the generated QR image once available", async () => {
    QRCodeLib.toDataURL.mockResolvedValue("data:image/png;base64,fake");

    render(<QRCode value="RFX-1001" />);

    await waitFor(() =>
      expect(screen.getByTestId("qrcode-image")).toBeInTheDocument()
    );
    const img = screen.getByTestId("qrcode-image");
    expect(img).toHaveAttribute("src", "data:image/png;base64,fake");
    expect(img).toHaveAttribute("alt", "QR code for RFX-1001");
  });

  it("respects a custom size prop", async () => {
    QRCodeLib.toDataURL.mockResolvedValue("data:image/png;base64,fake");

    render(<QRCode value="RFX-1001" size={300} />);

    await waitFor(() =>
      expect(QRCodeLib.toDataURL).toHaveBeenCalledWith(
        "RFX-1001",
        expect.objectContaining({ width: 300 })
      )
    );
    expect(screen.getByTestId("qrcode-image")).toHaveAttribute("width", "300");
  });

  it("respects a custom altText prop", async () => {
    QRCodeLib.toDataURL.mockResolvedValue("data:image/png;base64,fake");

    render(<QRCode value="RFX-1001" altText="Scan to confirm delivery" />);

    await waitFor(() =>
      expect(screen.getByTestId("qrcode-image")).toHaveAttribute(
        "alt",
        "Scan to confirm delivery"
      )
    );
  });

  it("shows an error state when QR generation fails, without crashing", async () => {
    QRCodeLib.toDataURL.mockRejectedValue(new Error("Generation failed"));

    render(<QRCode value="RFX-1001" />);

    await waitFor(() =>
      expect(screen.getByTestId("qrcode-error")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("qrcode-image")).not.toBeInTheDocument();
  });

  it("re-generates when the value prop changes", async () => {
    QRCodeLib.toDataURL.mockResolvedValue("data:image/png;base64,fake");

    const { rerender } = render(<QRCode value="RFX-1001" />);
    await waitFor(() =>
      expect(QRCodeLib.toDataURL).toHaveBeenCalledWith(
        "RFX-1001",
        expect.anything()
      )
    );

    rerender(<QRCode value="RFX-2002" />);
    await waitFor(() =>
      expect(QRCodeLib.toDataURL).toHaveBeenCalledWith(
        "RFX-2002",
        expect.anything()
      )
    );
  });
});