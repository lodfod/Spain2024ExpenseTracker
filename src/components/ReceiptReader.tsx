import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { useToast } from "../hooks/use-toast";

// interface ReceiptReaderProps {
//   onExtractedData?: (data: {
//     itemName?: string;
//     cost?: number;
//     location?: string;
//     date?: string;
//   }) => void;
// }

// export function ReceiptReader({ onExtractedData }: ReceiptReaderProps) {
export function ReceiptReader() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      if (
        !selectedFile.type.startsWith("image/") &&
        selectedFile.type !== "application/pdf"
      ) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image or PDF file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProcessReceipt = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      // TODO: Add receipt processing logic here
      toast({
        title: "Processing receipt",
        description: "This feature is coming soon!",
      });
    } catch (error) {
      toast({
        title: "Error processing receipt",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
        <Input
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.pdf"
          className="hidden"
          ref={fileInputRef}
        />

        {!file ? (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium">Upload a receipt</p>
              <p className="text-xs text-muted-foreground">
                Drag and drop or click to upload
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4 w-full">
            <div className="flex items-center gap-2 flex-1">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm truncate">{file.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {file && (
        <Button
          onClick={handleProcessReceipt}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Receipt...
            </>
          ) : (
            "Process Receipt"
          )}
        </Button>
      )}

      <div className="text-xs text-muted-foreground">
        <p>Supported formats: JPEG, PNG, PDF</p>
        <p>Maximum file size: 5MB</p>
      </div>
    </div>
  );
}
