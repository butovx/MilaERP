import { createCanvas } from "canvas";
import JsBarcode from "jsbarcode";

/**
 * Generates a random EAN13 barcode with a given prefix.
 *
 * @param prefix Barcode prefix (usually country code, e.g. "460" for Russia)
 * @returns Generated EAN13 barcode
 */
export function generateEAN13(prefix: string = "460"): string {
  // Check that the prefix does not exceed 12 digits
  if (prefix.length >= 12) {
    prefix = prefix.substring(0, 11);
  }

  // Generate random digits to fill up to 12 digits
  let code = prefix;
  const randomDigitsCount = 12 - prefix.length;

  for (let i = 0; i < randomDigitsCount; i++) {
    code += Math.floor(Math.random() * 10);
  }

  // Calculate check digit
  let checksum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    checksum += i % 2 === 0 ? digit : digit * 3;
  }

  const checksumDigit = (10 - (checksum % 10)) % 10;

  return code + checksumDigit;
}

// Formats EAN-13 string as "X XXXXXX XXXXXX"
function formatEAN13(code: string): string {
  if (code.length !== 13) return code;
  return `${code.substring(0, 1)} ${code.substring(1, 7)} ${code.substring(7)}`;
}

/**
 * Generates barcode image in PNG format.
 *
 * @param code Barcode to generate image for
 * @returns Promise with image buffer in PNG format
 */
export async function generateBarcodeImage(code: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = createCanvas(300, 110);

      JsBarcode(canvas, code, {
        format: "EAN13",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });

      const ctx = canvas.getContext("2d");

      if (code.length === 13) {
        // Clear the area where the standard text was
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 70, canvas.width, 30);

        // Draw formatted text
        ctx.fillStyle = "#000000";
        ctx.textBaseline = "top";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";

        const formattedText = formatEAN13(code);
        ctx.fillText(formattedText, canvas.width / 2, 75);
      }

      const buffer = canvas.toBuffer("image/png");
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  });
}
