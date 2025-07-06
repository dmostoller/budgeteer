// Note: pdf-parse doesn't work directly in the browser
// We'll need to send the file to the server for processing

export async function extractFileContent(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Handle CSV and text files
  if (
    fileType === "text/csv" ||
    fileType === "text/plain" ||
    fileName.endsWith(".csv")
  ) {
    try {
      return await file.text();
    } catch (error) {
      console.error("Error reading text file:", error);
      throw new Error("Failed to read text file content");
    }
  }

  // For PDF and image files, we'll send them to the server
  // The server will handle the extraction
  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "PDF_FILE_REQUIRES_SERVER_PROCESSING";
  }

  // For images, we'll also need server-side processing
  if (
    fileType.startsWith("image/") ||
    fileName.match(/\.(png|jpg|jpeg|gif|bmp)$/i)
  ) {
    return "IMAGE_FILE_REQUIRES_SERVER_PROCESSING";
  }

  throw new Error(`Unsupported file type: ${fileType || "unknown"}`);
}

export function isFileSupported(file: File): boolean {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  const supportedTypes = [
    "application/pdf",
    "text/csv",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];

  const supportedExtensions = [".pdf", ".csv", ".txt", ".png", ".jpg", ".jpeg"];

  return (
    supportedTypes.includes(fileType) ||
    supportedExtensions.some((ext) => fileName.endsWith(ext))
  );
}

export function getFileTypeInfo(file: File): {
  type: "pdf" | "csv" | "image" | "text" | "unknown";
  requiresServerProcessing: boolean;
} {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return { type: "pdf", requiresServerProcessing: true };
  }

  if (fileType === "text/csv" || fileName.endsWith(".csv")) {
    return { type: "csv", requiresServerProcessing: false };
  }

  if (
    fileType.startsWith("image/") ||
    fileName.match(/\.(png|jpg|jpeg|gif|bmp)$/i)
  ) {
    return { type: "image", requiresServerProcessing: true };
  }

  if (fileType === "text/plain" || fileName.endsWith(".txt")) {
    return { type: "text", requiresServerProcessing: false };
  }

  return { type: "unknown", requiresServerProcessing: false };
}
