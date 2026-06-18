import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

/**
 * Uploads a file to the storage
 * Saves the file locally to public/uploads directory
 */
export async function uploadFile(file: File): Promise<string> {
  try {
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;

    // Save locally
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    // Create uploads directory if it does not exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save the file
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Return the URL to the file via our API endpoint for reliable serving without Next.js static caching
    return `/api/uploads/${fileName}`;
  } catch (error: any) {
    console.error("Ошибка при загрузке файла:", error);
    throw new Error(
      "Ошибка при загрузке файла: " + (error.message || "Неизвестная ошибка")
    );
  }
}

/**
 * Uploads multiple files to the storage
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFile(file));
  return Promise.all(uploadPromises);
}

/**
 * Deletes a file from the storage
 * @param filePath File path (relative or full URL)
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    // If path starts with http, it is Vercel Blob
    if (filePath.startsWith("http")) {
      console.warn("Удаление из Vercel Blob не реализовано");
      return false;
    }

    // If it is a local file
    if (filePath.startsWith("/uploads/") || filePath.startsWith("/api/uploads/")) {
      const fileName = path.basename(filePath);
      const fullPath = path.join(process.cwd(), "public", "uploads", fileName);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      } else {
        console.warn(`Файл ${fullPath} не найден`);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error("Ошибка при удалении файла:", error);
    return false;
  }
}

/**
 * Deletes unused files
 * @param usedPaths Array of used file paths
 */
export async function deleteUnusedFiles(): Promise<{
  deleted: number;
  errors: number;
}> {
  try {
    // Get all file paths from the database
    const pool = (await import("@/lib/db")).default;
    const result = await pool.query("SELECT photo_paths FROM products");

    // Collect all used paths
    const usedPaths = new Set<string>();
    result.rows.forEach((row) => {
      const paths = JSON.parse(row.photo_paths || "[]");
      paths.forEach((path: string) => usedPaths.add(path));
    });

    // Get the list of all files in the uploads folder
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      return { deleted: 0, errors: 0 };
    }

    const files = fs.readdirSync(uploadsDir);
    let deleted = 0;
    let errors = 0;

    // Delete files that are not used
    for (const file of files) {
      const legacyPath = `/uploads/${file}`;
      const apiPath = `/api/uploads/${file}`;
      if (!usedPaths.has(legacyPath) && !usedPaths.has(apiPath)) {
        try {
          fs.unlinkSync(path.join(uploadsDir, file));
          deleted++;
        } catch (error) {
          console.error(`Ошибка при удалении файла ${file}:`, error);
          errors++;
        }
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error("Ошибка при удалении неиспользуемых файлов:", error);
    return { deleted: 0, errors: 1 };
  }
}
