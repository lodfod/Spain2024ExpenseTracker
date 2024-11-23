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
import { Paperclip } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { GroupMember } from "../lib/types";
import supabase from "../lib/createClient";
import { Session } from "@supabase/supabase-js";

interface ExpenseItem {
  name: string;
  cost: number;
  location: string;
  category: string;
  payers: string[];
  attachment?: File;
  creator: string;
}

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
  const [payers, setPayers] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groupMembers.map((member) => [member, false]))
  );
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setPayers((prev) =>
      Object.fromEntries(Object.keys(prev).map((key) => [key, isChecked]))
    );
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

    if (Object.values(payers).every((v) => !v)) {
      newErrors.payers = "At least one payer must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Form Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    const expenseItem: ExpenseItem = {
      name: itemName,
      cost: parseFloat(itemCost),
      location: location,
      category: category,
      payers: Object.entries(payers)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, value]) => value)
        .map(([key]) => key),
      attachment: attachment || undefined,
      creator: session?.user.id,
    };
    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert(expenseItem);
      if (error) {
        toast({
          title: "Error adding expense",
          description: error.message,
          variant: "destructive",
        });
      }
      if (data) {
        toast({
          title: "Expense added",
          description: `Your expense "${expenseItem.name}" has been successfully added.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error adding expense",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }

    console.log(
      "Submitted expense item:",
      JSON.stringify(
        {
          ...expenseItem,
          attachment: attachment ? attachment.name : undefined,
        },
        null,
        2
      )
    );

    // Reset form
    setItemName("");
    setItemCost("");
    setLocation("");
    setCategory("");
    setPayers(
      Object.fromEntries(groupMembers.map((member) => [member.id, false]))
    );
    setAttachment(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-col items-start">
        <CardTitle>Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
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
                  checked={Object.values(payers).every(Boolean)}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="selectAll">Select All</Label>
              </div>
              {groupMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <Checkbox
                    id={member.id}
                    checked={payers[member.id]}
                    onCheckedChange={(checked) =>
                      setPayers((prev) => ({
                        ...prev,
                        [member.id]: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor={member.id}>{member.full_name}</Label>
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
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" onClick={handleSubmit}>
          Add Expense
        </Button>
      </CardFooter>
    </Card>
  );
}