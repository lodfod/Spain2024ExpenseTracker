import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import supabase from "../../lib/createClient";

import { Expense } from "../../lib/types";
import { useState, useEffect } from "react";

import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { UUID } from "crypto";

export function AllExpenses() {
  const [allExpenses, setAllExpenses] = useState<Expense[]>();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      const { data, error } = await supabase.from("expenses").select(`
          *,
          profiles:creator (
            full_name
          ),
          payer_amounts (
            user_id,
            amount,
            profiles:user_id (
              full_name
            )
          )
        `);

      if (error) {
        console.log("Error fetching expenses:", error);
      } else {
        const processedExpenses = data.map((expense) => ({
          ...expense,
          expenseName: expense.name,
          creatorName: expense.profiles.full_name,
          date: format(new Date(expense.created_at), "MM/dd/yyyy HH:mm"),
          payers: expense.payer_amounts.map(
            (pa: {
              user_id: UUID;
              profiles: { full_name: string };
              amount: number;
            }) => ({
              id: pa.user_id,
              full_name: pa.profiles.full_name,
              amount: pa.amount,
            })
          ),
        }));
        setAllExpenses(processedExpenses);
      }
    };
    fetchExpenses();
  }, []);
  return (
    <div className="container mx-auto">
      <Table>
        <TableCaption>A list of all expenses.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Creator Name</TableHead>
            <TableHead>Expense Name</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allExpenses?.map((expense) => (
            <Popover
              key={expense.id}
              open={openPopoverId === expense.id}
              onOpenChange={(open) =>
                setOpenPopoverId(open ? expense.id : null)
              }
            >
              <PopoverTrigger asChild>
                <TableRow className="text-left cursor-pointer hover:bg-muted/50">
                  <TableCell>{expense.creatorName}</TableCell>
                  <TableCell>{expense.expenseName}</TableCell>
                  <TableCell>
                    {expense.original_currency === "USD" ? "$" : "€"}
                    {expense.cost.toFixed(2)}
                  </TableCell>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.location}</TableCell>
                </TableRow>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Payers</h4>
                    <p className="text-sm text-muted-foreground">
                      List of people who owe money for this expense
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {expense.payers.length > 1 ? (
                      expense.payers.map(
                        (payer, index) =>
                          payer.id !== expense.creator && (
                            <div
                              key={index}
                              className="grid grid-cols-2 items-center gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <div className="font-medium">
                                  {payer.full_name}
                                </div>
                              </div>
                              <div className="text-right font-medium">
                                {expense.original_currency === "USD"
                                  ? "$"
                                  : "€"}
                                {payer.amount.toFixed(2)}
                              </div>
                            </div>
                          )
                      )
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No additional payers
                      </div>
                    )}
                  </div>
                  {expense.receipt_url && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          window.open(expense.receipt_url, "_blank")
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Receipt
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
