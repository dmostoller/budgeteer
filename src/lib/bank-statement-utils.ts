/**
 * Utility functions for processing bank statements
 */

/**
 * Split bank statement content into manageable chunks for AI processing
 * Splits by transaction count to avoid output token limits
 */
export function splitBankStatementContent(
  content: string,
  maxTransactionsPerBatch: number = 40 // Limit transactions per batch
): string[] {
  const lines = content.split('\n');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let transactionCount = 0;
  let headerLines: string[] = [];
  
  // Transaction detection patterns
  const transactionPatterns = [
    // Date patterns
    /^\s*\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/, // MM/DD/YYYY or MM-DD-YYYY
    /^\s*\d{4}[-\/]\d{2}[-\/]\d{2}/, // YYYY-MM-DD
    /^\s*\w{3}\s+\d{1,2},?\s+\d{4}/, // Jan 1, 2024
    // Combined with amounts
    /\$[\d,]+\.\d{2}/, // Dollar amounts
    /[\d,]+\.\d{2}\s*(?:CR|DR)?/i, // Amounts with CR/DR
  ];
  
  // Detect if a line is likely a transaction
  const isTransactionLine = (line: string): boolean => {
    const hasDate = transactionPatterns.slice(0, 3).some(p => p.test(line));
    const hasAmount = transactionPatterns.slice(3).some(p => p.test(line));
    
    // A transaction typically has both a date and an amount, or at least an amount with description
    return (hasDate && hasAmount) || (hasAmount && line.length > 20) || (hasDate && line.length > 15);
  };
  
  // Identify header lines (before first transaction)
  let firstTransactionIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isTransactionLine(lines[i])) {
      firstTransactionIndex = i;
      break;
    }
  }
  
  if (firstTransactionIndex > 0) {
    headerLines = lines.slice(0, firstTransactionIndex);
  }
  
  // Process lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) {
      if (currentChunk.length > 0) {
        currentChunk.push(line);
      }
      continue;
    }
    
    // Check if this is a transaction line
    if (isTransactionLine(line)) {
      transactionCount++;
      
      // If we've reached the limit, start a new chunk
      if (transactionCount > maxTransactionsPerBatch && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
        currentChunk = [...headerLines]; // Include headers in each chunk
        transactionCount = 1;
      }
    }
    
    currentChunk.push(line);
  }
  
  // Add the last chunk if it has content
  if (currentChunk.length > headerLines.length) {
    chunks.push(currentChunk.join('\n'));
  }
  
  // If no chunks were created, return the entire content as one chunk
  if (chunks.length === 0 && lines.length > 0) {
    chunks.push(content);
  }
  
  console.log(`Split content into ${chunks.length} chunks with ~${maxTransactionsPerBatch} transactions each`);
  
  return chunks;
}

/**
 * Estimate the number of transactions in a content chunk
 * This helps with progress tracking
 */
export function estimateTransactionCount(content: string): number {
  // Common patterns that indicate a transaction line
  const transactionPatterns = [
    /\$[\d,]+\.\d{2}/, // Dollar amounts
    /\d{1,2}\/\d{1,2}\/\d{2,4}/, // Dates in MM/DD/YYYY format
    /\d{4}-\d{2}-\d{2}/, // Dates in YYYY-MM-DD format
    /(?:debit|credit|withdrawal|deposit|payment|purchase)/i,
  ];
  
  const lines = content.split('\n');
  let count = 0;
  
  for (const line of lines) {
    // Check if line matches multiple transaction patterns
    const matches = transactionPatterns.filter(pattern => pattern.test(line)).length;
    if (matches >= 2) {
      count++;
    }
  }
  
  return count;
}

/**
 * Merge transaction results from multiple batches
 */
interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  isRecurring: boolean;
  merchantName?: string;
}

export interface BatchResult {
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    transactionCount: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export function mergeBatchResults(results: BatchResult[]): BatchResult {
  if (results.length === 0) {
    return {
      transactions: [],
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        transactionCount: 0,
        dateRange: {
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
      },
    };
  }

  // Combine all transactions
  const allTransactions = results.flatMap(r => r.transactions);
  
  // Calculate combined totals
  const totalIncome = results.reduce((sum, r) => sum + r.summary.totalIncome, 0);
  const totalExpenses = results.reduce((sum, r) => sum + r.summary.totalExpenses, 0);
  
  // Find overall date range
  const allDates = results.flatMap(r => [r.summary.dateRange.start, r.summary.dateRange.end]);
  const startDate = allDates.sort()[0];
  const endDate = allDates.sort()[allDates.length - 1];
  
  return {
    transactions: allTransactions,
    summary: {
      totalIncome,
      totalExpenses,
      transactionCount: allTransactions.length,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    },
  };
}