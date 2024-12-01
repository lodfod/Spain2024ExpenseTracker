import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { GroupMember, ProcessedExpense } from "../lib/types";

interface ShowTotalsProps {
  expenses: ProcessedExpense[];
  groupMembers: GroupMember[];
}

export function ShowTotals({ expenses, groupMembers }: ShowTotalsProps) {
  const debts = useMemo(() => {
    console.log("Expenses:", expenses);
    console.log("Group Members:", groupMembers);

    const debtMap: Record<string, Record<string, number>> = {};

    if (!groupMembers?.length || !expenses?.length) {
      return debtMap;
    }

    // Initialize all possible combinations to 0
    groupMembers.forEach((creditor) => {
      if (creditor?.id) {
        debtMap[creditor.id] = {};
        groupMembers.forEach((debtor) => {
          if (debtor?.id) {
            debtMap[creditor.id][debtor.id] = 0;
          }
        });
      }
    });

    // use the expense creator's id to find the main payer
    expenses.forEach((expense) => {
      const mainPayer = expense.payers.find((p) => p.id === expense.creator);
      if (!mainPayer) return;

      expense.payers.forEach((debtor) => {
        if (debtor.id !== mainPayer.id && debtor.amount > 0) {
          debtMap[mainPayer.id][debtor.id] += debtor.amount;
        }
      });
    });

    console.log("Final debt map:", debtMap);
    return debtMap;
  }, [expenses, groupMembers]);

  // Add safety check for render
  if (!groupMembers?.length) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Who Owes Who</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={0}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">
                    Owes ↓ / Is Owed →
                  </TableHead>
                  {groupMembers.map((member) => (
                    <TableHead key={member.id} className="min-w-[100px]">
                      {member.full_name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupMembers.map((debtor) => (
                  <TableRow key={debtor.id}>
                    <TableCell className="font-medium">
                      {debtor.full_name}
                    </TableCell>
                    {groupMembers.map((creditor) => {
                      const amount = debts[creditor.id]?.[debtor.id] || 0;
                      return (
                        <TableCell key={creditor.id}>
                          <Tooltip>
                            <TooltipTrigger
                              className={`w-full h-full cursor-help ${
                                amount > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : ""
                              }`}
                            >
                              {debtor.id === creditor.id
                                ? "-"
                                : amount > 0
                                ? `€${amount.toFixed(2)}`
                                : "€0.00"}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">
                                {debtor.id === creditor.id
                                  ? "Same person"
                                  : amount > 0
                                  ? `${debtor.full_name} owes ${
                                      creditor.full_name
                                    } €${amount.toFixed(2)}`
                                  : `No debt between ${debtor.full_name} and ${creditor.full_name}`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
