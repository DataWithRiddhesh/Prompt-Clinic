import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePatient,
  getGetDashboardQueryKey,
  getListPatientsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";

export default function NewPatient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPatient = useCreatePatient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter the patient's name";
    if (!/^\d{10}$/.test(phone)) e.phone = "Phone must be 10 digits";
    const a = Number(age);
    if (!age || Number.isNaN(a) || a < 0 || a > 130) e.age = "Enter a valid age";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    createPatient.mutate(
      {
        data: {
          name: name.trim(),
          phone,
          age: Number(age),
          gender,
        },
      },
      {
        onSuccess: (created) => {
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          toast({ title: "Patient added", description: `${created.name} has been saved.` });
          setLocation(`/patients/${created.id}`);
        },
        onError: () => {
          toast({
            title: "Could not save patient",
            description: "Please check the details and try again.",
            variant: "destructive",
          });
        },
      },
    );
  }

  const isSubmitting = createPatient.isPending;

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => window.history.back()}
        className="hover-elevate active-elevate-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground mb-3 px-2 py-1 rounded-md"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add a new patient</h1>
          <p className="text-sm text-muted-foreground">A few quick details — that's it.</p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-card border border-card-border shadow-sm p-5 sm:p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-semibold mb-1.5">Patient name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 rounded-lg border border-input bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="e.g. Anita Sharma"
            autoFocus
          />
          {errors.name && <p className="text-xs text-destructive mt-1.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Phone number</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground font-medium">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="flex-1 h-12 rounded-r-lg border border-input bg-background px-3.5 text-base tabular-nums outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="10 digit number"
            />
          </div>
          {errors.phone && <p className="text-xs text-destructive mt-1.5">{errors.phone}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Age</label>
            <input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full h-12 rounded-lg border border-input bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Years"
              min={0}
              max={130}
            />
            {errors.age && <p className="text-xs text-destructive mt-1.5">{errors.age}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Gender</label>
            <div className="flex rounded-lg border border-input bg-background overflow-hidden">
              {(["Male", "Female", "Other"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 h-12 text-sm font-semibold transition ${
                    gender === g
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover-elevate"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold shadow-md hover-elevate active-elevate-2 inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Save patient
        </button>
      </form>
    </div>
  );
}
