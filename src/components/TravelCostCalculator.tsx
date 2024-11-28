import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Paperclip, Loader2, EuroIcon, DollarSign } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { GroupMember } from "../lib/types";
import supabase from "../lib/createClient";
import { Session } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { ExpenseItem } from "../lib/types";
// import { ReceiptReader } from "./ReceiptReader";

interface TravelCostCalculatorProps {
  groupMembers: GroupMember[];
  locations: string[];
  categories: string[];
  session: Session;
}

export default function TravelCostCalculator({
  groupMembers,
  locations,
  categories,
  session,
}: TravelCostCalculatorProps) {
  const [itemName, setItemName] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [payers, setPayers] = useState<
    Record<string, { selected: boolean; amount?: number }>
  >(() =>
    Object.fromEntries(
      groupMembers.map((member) => [member.id, { selected: false }])
    )
  );
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "uploading" | "saving" | "success" | "error"
  >("idle");

  const { toast } = useToast();

  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const DOLLAR_TO_EURO_RATE = 0.95;

  const calculateSplitAmounts = (
    totalAmount: number,
    count: number
  ): number[] => {
    // Convert to cents to avoid floating point precision issues
    const totalCents = Math.round(totalAmount * 100);
    const baseAmountCents = Math.floor(totalCents / count);
    const remainderCents = totalCents % count;

    // Initialize all amounts with the base amount
    const amounts = Array(count).fill(baseAmountCents);

    // Distribute the remaining cents
    for (let i = 0; i < remainderCents; i++) {
      amounts[i]++;
    }

    // Convert back to dollars/euros with 2 decimal places
    return amounts.map((cents) => Number((cents / 100).toFixed(2)));
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      const splitAmounts = calculateSplitAmounts(
        parseFloat(itemCost || "0"),
        groupMembers.length
      );

      setPayers(
        Object.fromEntries(
          groupMembers.map((member, index) => [
            member.id,
            {
              selected: true,
              amount: splitAmounts[index],
            },
          ])
        )
      );
    } else {
      setPayers(
        Object.fromEntries(
          groupMembers.map((member) => [
            member.id,
            { selected: false, amount: undefined },
          ])
        )
      );
    }
  };

  const handleAmountChange = (id: string, amount: string) => {
    setPayers((prev) => ({
      ...prev,
      [id]: { ...prev[id], amount: amount ? parseFloat(amount) : undefined },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        // 20MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setAttachment(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (itemName.trim().length === 0) {
      newErrors.itemName = "Item name is required";
    } else if (itemName.trim().length > 100) {
      newErrors.itemName = "Item name must be 100 characters or less";
    }

    if (itemCost.trim().length === 0) {
      newErrors.itemCost = "Cost is required";
    } else {
      const cost = parseFloat(itemCost);
      if (isNaN(cost) || cost <= 0) {
        newErrors.itemCost = "Cost must be a positive number";
      } else if (cost > 1000000) {
        newErrors.itemCost = "Cost must be less than or equal to 1,000,000";
      }
    }

    if (!location) {
      newErrors.location = "Location is required";
    }

    if (!category) {
      newErrors.category = "Category is required";
    }

    const selectedPayers = Object.entries(payers).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value.selected
    );
    if (selectedPayers.length === 0) {
      newErrors.payers = "At least one payer must be selected";
    }

    const totalAmount = selectedPayers.reduce(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (sum, [_, value]) => sum + (value.amount || 0),
      0
    );
    if (Math.abs(totalAmount - parseFloat(itemCost)) > 0.01) {
      newErrors.payers = "Total amounts must equal the expense cost";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: "Upload failed",
          description: uploadError.message,
          variant: "destructive",
        });
        return null;
      }

      const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const convertToEuros = (amount: number): number => {
    return currency === "USD"
      ? Number((amount * DOLLAR_TO_EURO_RATE).toFixed(2))
      : amount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let receiptUrl: string | null = null;
      if (attachment) {
        setSubmitStatus("uploading");
        receiptUrl = await uploadReceipt(attachment);
        if (!receiptUrl) {
          setSubmitStatus("error");
          return;
        }
      }

      setSubmitStatus("saving");

      // Convert amount to euros before saving
      const costInEuros = Number(convertToEuros(Number(itemCost)).toFixed(2));

      // First, insert the expense
      const expenseItem: ExpenseItem = {
        name: itemName,
        cost: costInEuros, // Save in euros
        location,
        category,
        payers: Object.entries(payers)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, value]) => value.selected)
          .map(([key]) => key),
        creator: session?.user.id,
        receipt_url: receiptUrl || undefined,
        original_currency: currency, // Add this to your ExpenseItem type
        original_amount: parseFloat(itemCost), // Add this to your ExpenseItem type
      };

      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .insert(expenseItem)
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Then, insert the payer amounts
      const payerAmounts = Object.entries(payers)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, value]) => value.selected)
        .map(([userId, value]) => ({
          expense_id: expenseData.id,
          user_id: userId,
          amount:
            value.amount ||
            parseFloat(itemCost) /
              Object.values(payers).filter((p) => p.selected).length,
        }));

      const { error: amountsError } = await supabase
        .from("payer_amounts")
        .insert(payerAmounts);

      if (amountsError) throw amountsError;

      setSubmitStatus("success");
      toast({
        title: "Success",
        description: "Expense added successfully",
      });

      // Reset form
      setItemName("");
      setItemCost("");
      setLocation("");
      setCategory("");
      setPayers(
        Object.fromEntries(
          groupMembers.map((member) => [member.id, { selected: false }])
        )
      );
      setAttachment(null);
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSubmitStatus("idle");
    } catch (error) {
      setSubmitStatus("error");
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-col items-start">
        <CardTitle>Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual-input" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual-input">Cost Input</TabsTrigger>
            {/* <TabsTrigger value="receipt-reader">Receipt Reader</TabsTrigger> */}
          </TabsList>

          <TabsContent value="manual-input">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-2 items-start">
                  <Label htmlFor="itemName" className="self-start">
                    Item Name
                  </Label>
                  <Input
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    aria-invalid={!!errors.itemName}
                    aria-describedby={
                      errors.itemName ? "itemName-error" : undefined
                    }
                  />
                  {errors.itemName && (
                    <p id="itemName-error" className="text-sm text-red-500">
                      {errors.itemName}
                    </p>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2 items-start">
                  <Label htmlFor="itemCost" className="self-start">
                    Cost
                  </Label>
                  <div className="flex w-full gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="itemCost"
                        type="number"
                        value={itemCost}
                        onChange={(e) => setItemCost(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        aria-invalid={!!errors.itemCost}
                        aria-describedby={
                          errors.itemCost ? "itemCost-error" : undefined
                        }
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {currency === "EUR" ? (
                          <EuroIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <Select
                      value={currency}
                      onValueChange={(value: "EUR" | "USD") =>
                        setCurrency(value)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {currency === "USD" && (
                    <p className="text-xs text-muted-foreground">
                      ≈ €
                      {convertToEuros(parseFloat(itemCost || "0")).toFixed(2)}
                    </p>
                  )}
                  {errors.itemCost && (
                    <p id="itemCost-error" className="text-sm text-red-500">
                      {errors.itemCost}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-2 items-start">
                  <Label htmlFor="location" className="self-start">
                    Location
                  </Label>
                  <Select value={location} onValueChange={setLocation} required>
                    <SelectTrigger
                      id="location"
                      aria-invalid={!!errors.location}
                      aria-describedby={
                        errors.location ? "location-error" : undefined
                      }
                    >
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p id="location-error" className="text-sm text-red-500">
                      {errors.location}
                    </p>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2 items-start">
                  <Label htmlFor="category" className="self-start">
                    Category
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger
                      id="category"
                      aria-invalid={!!errors.category}
                      aria-describedby={
                        errors.category ? "category-error" : undefined
                      }
                    >
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p id="category-error" className="text-sm text-red-500">
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <Label className="self-start">Who should be charged?</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="selectAll"
                      checked={
                        Object.values(payers).length > 0 &&
                        Object.values(payers).every((p) => p.selected)
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all payers"
                    />
                    <Label htmlFor="selectAll">Split Equally</Label>
                  </div>
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Checkbox
                        id={member.id}
                        checked={payers[member.id]?.selected}
                        onCheckedChange={(checked) =>
                          setPayers((prev) => {
                            const newPayers = {
                              ...prev,
                              [member.id]: {
                                ...prev[member.id],
                                selected: checked === true,
                                amount: undefined,
                              },
                            };

                            const selectedPayers = Object.values(
                              newPayers
                            ).filter((p) => p.selected);
                            if (selectedPayers.length > 0) {
                              const splitAmounts = calculateSplitAmounts(
                                parseFloat(itemCost || "0"),
                                selectedPayers.length
                              );

                              let amountIndex = 0;
                              return Object.fromEntries(
                                Object.entries(newPayers).map(
                                  ([key, value]) => [
                                    key,
                                    {
                                      ...value,
                                      amount: value.selected
                                        ? splitAmounts[amountIndex++]
                                        : undefined,
                                    },
                                  ]
                                )
                              );
                            }

                            return newPayers;
                          })
                        }
                      />
                      <Label htmlFor={member.id}>{member.full_name}</Label>
                      {payers[member.id]?.selected && (
                        <Input
                          type="number"
                          value={payers[member.id]?.amount?.toString() || ""}
                          onChange={(e) =>
                            handleAmountChange(member.id, e.target.value)
                          }
                          className="w-24 h-8"
                          placeholder="Amount"
                          min="0"
                          step="0.01"
                        />
                      )}
                    </div>
                  ))}
                </div>
                {errors.payers && (
                  <p className="text-sm text-red-500">{errors.payers}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-start">
                <Label htmlFor="attachment" className="self-start">
                  Attachment (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="attachment"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/*,.pdf"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    {attachment ? "Change File" : "Upload File"}
                  </Button>
                  {attachment && (
                    <span className="text-sm text-muted-foreground">
                      {attachment.name}
                    </span>
                  )}
                </div>
              </div>
            </form>
          </TabsContent>

          {/* <TabsContent value="receipt-reader">
            <ReceiptReader
              onExtractedData={(data) => {
                // Handle extracted data
                if (data.itemName) setItemName(data.itemName);
                if (data.cost) setItemCost(data.cost.toString());
                if (data.location) setLocation(data.location);
                // ... handle other fields
              }}
            />
          </TabsContent> */}
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          className="w-full"
          onClick={handleSubmit}
          disabled={submitStatus !== "idle"}
        >
          {submitStatus === "idle" && "Add Expense"}
          {submitStatus === "uploading" && (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading Receipt...
            </>
          )}
          {submitStatus === "saving" && (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Expense...
            </>
          )}
          {submitStatus === "success" && "Success!"}
          {submitStatus === "error" && "Error - Try Again"}
        </Button>
      </CardFooter>
    </Card>
  );
}
