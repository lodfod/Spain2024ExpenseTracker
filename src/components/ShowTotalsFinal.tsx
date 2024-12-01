import { useMemo } from "react";
import { ProcessedExpense, GroupMember } from "../lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "./ui/table";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip";

interface ShowTotalsProps {
  expenses: ProcessedExpense[];
  groupMembers: GroupMember[];
}

export function ShowTotalsFinal({ expenses, groupMembers }: ShowTotalsProps) {
  const debts = useMemo(() => {
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

    // Calculate initial debts (same as before)
    expenses.forEach((expense) => {
      const mainPayer = expense.payers.find((p) => p.id === expense.creator);
      if (!mainPayer) return;

      expense.payers.forEach((debtor) => {
        if (debtor.id !== mainPayer.id && debtor.amount > 0) {
          debtMap[mainPayer.id][debtor.id] += debtor.amount;
        }
      });
    });

    // Reconcile bidirectional debts
    groupMembers.forEach((person1) => {
      groupMembers.forEach((person2) => {
        if (person1.id && person2.id && person1.id !== person2.id) {
          const debt1to2 = debtMap[person2.id][person1.id];
          const debt2to1 = debtMap[person1.id][person2.id];

          // Offset the debts
          if (debt1to2 > 0 && debt2to1 > 0) {
            if (debt1to2 > debt2to1) {
              debtMap[person2.id][person1.id] = debt1to2 - debt2to1;
              debtMap[person1.id][person2.id] = 0;
            } else {
              debtMap[person1.id][person2.id] = debt2to1 - debt1to2;
              debtMap[person2.id][person1.id] = 0;
            }
          }
        }
      });
    });

    return debtMap;
  }, [expenses, groupMembers]);

  // ... rest of the component remains the same as ShowTotals.tsx ...
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reconciled Debts</CardTitle>
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
