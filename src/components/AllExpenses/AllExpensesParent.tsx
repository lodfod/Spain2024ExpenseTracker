import { AllExpenses } from "./AllExpenses";

export default function ExpensesPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">
        <section className="w-full ">
          <div className="container px-4 md:px-6">
            <h1 className="text-lg text-left font-bold tracking-tighter ">
              All Expenses
            </h1>
            <div className="text-base font-normal">
              <AllExpenses />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
