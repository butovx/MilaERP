import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function uploadFiles(files: File[]): Promise<string[]> {
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const paths: string[] = [];
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const ext = file.name.split(".").pop();
    const filename = `${uuidv4()}.${ext}`;
    const filepath = join(uploadDir, filename);
    
    await writeFile(filepath, buffer);
    paths.push(`/api/uploads/${filename}`);
  }
  return paths;
}
