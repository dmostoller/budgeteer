"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  extractFileContent,
  isFileSupported,
  getFileTypeInfo,
} from "@/lib/file-extraction";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { TransactionImportReview } from "./transaction-import-review";
import { ExpenseCategory, IncomeCategory } from "@prisma/client";

interface Transaction {
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: ExpenseCategory | IncomeCategory;
  isRecurring: boolean;
  merchantName?: string;
  isDuplicate: boolean;
  suggestedAction: "import" | "skip";
}

interface StatementUploadProps {
  onImportComplete?: () => void;
}

export function StatementUpload({ onImportComplete }: StatementUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Reset state to ensure clean processing
    setError(null);
    setTransactions([]);
    setShowReview(false);
    setIsProcessing(true);
    setUploadProgress(10);

    // Validate file type
    if (!isFileSupported(file)) {
      setError(
        "Unsupported file type. Please upload a PDF, CSV, or image file.",
      );
      setIsProcessing(false);
      setUploadProgress(0);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const fileInfo = getFileTypeInfo(file);
      formData.append("fileType", fileInfo.type);

      setUploadProgress(20);

      // Try to extract content client-side for text files
      if (!fileInfo.requiresServerProcessing) {
        try {
          const fileContent = await extractFileContent(file);
          if (fileContent && fileContent.trim()) {
            formData.append("content", fileContent);
          }
        } catch (error) {
          console.warn("Failed to extract file content client-side:", error);
        }
      }

      setUploadProgress(50);

      const response = await fetch("/api/ai/analyze-statement", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to analyze statement");
      }

      const data = await response.json();

      if (!data.transactions || data.transactions.length === 0) {
        throw new Error(
          "No transactions found in the statement. Please ensure the file contains transaction data.",
        );
      }

      setTransactions(data.transactions);
      setShowReview(true);
      setUploadProgress(100);

      const batchMessage =
        data.batchesProcessed > 1
          ? ` (processed in ${data.batchesProcessed} batches)`
          : "";
      toast.success(
        `Found ${data.transactions.length} transactions to import${batchMessage}`,
      );
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to process the bank statement";
      setError(errorMessage);
      toast.error(errorMessage);
      // Reset state on error
      setTransactions([]);
      setShowReview(false);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "text/csv": [".csv"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB limit
    disabled: isProcessing,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection.errors[0]?.code === "file-too-large") {
        setError("File is too large. Maximum size is 10MB.");
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setError(
          "Invalid file type. Please upload a PDF, CSV, TXT, or image file.",
        );
      } else {
        setError("Failed to upload file. Please try again.");
      }
    },
  });

  const handleImport = async (selectedTransactions: Transaction[]) => {
    try {
      // Create expenses
      const expenses = selectedTransactions.filter((t) => t.type === "expense");
      const incomes = selectedTransactions.filter((t) => t.type === "income");

      const promises = [];

      if (expenses.length > 0) {
        promises.push(
          fetch("/api/expenses/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              expenses: expenses.map((t) => ({
                amount: t.amount,
                description: t.description,
                date: t.date,
                category: t.category,
                isRecurring: t.isRecurring,
              })),
            }),
          }),
        );
      }

      if (incomes.length > 0) {
        promises.push(
          fetch("/api/incomes/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              incomes: incomes.map((t) => ({
                amount: t.amount,
                source: t.description,
                date: t.date,
                category: t.category,
                isRecurring: t.isRecurring,
              })),
            }),
          }),
        );
      }

      await Promise.all(promises);

      setShowReview(false);
      setTransactions([]);
      onImportComplete?.();
    } catch (error) {
      console.error("Import error:", error);
      throw error;
    }
  };

  if (showReview) {
    return (
      <TransactionImportReview
        transactions={transactions}
        onImport={handleImport}
        onCancel={() => {
          setShowReview(false);
          setTransactions([]);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bank Statement Import
        </CardTitle>
        <CardDescription>
          Upload your bank statement to automatically import transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200 ease-in-out
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
            ${isProcessing ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"}
          `}
        >
          <input {...getInputProps()} />
          <div className="mx-auto w-12 h-12 mb-4">
            {isProcessing ? (
              <Loader2 className="w-full h-full animate-spin text-primary" />
            ) : (
              <Upload className="w-full h-full text-muted-foreground" />
            )}
          </div>
          <p className="text-sm font-medium mb-1">
            {isDragActive
              ? "Drop the file here"
              : "Drag & drop your bank statement here"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            or click to select a file
          </p>
          <p className="text-xs text-muted-foreground">
            Supports PDF, PNG, JPG, CSV, and TXT files (max 10MB)
          </p>
        </div>

        {isProcessing && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {uploadProgress < 80
                  ? "Uploading and extracting content..."
                  : "Analyzing transactions..."}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
            {uploadProgress >= 80 && (
              <p className="text-xs text-muted-foreground text-center">
                Large statements may be processed in multiple batches
              </p>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium">How it works:</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Upload PDF, CSV, or image files - AI extracts text automatically
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Automatically categorizes expenses and detects recurring
                payments
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Review and approve transactions before importing
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
