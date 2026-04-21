import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMe,
  useUpdateMe,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const updateMe = useUpdateMe();

  const [name, setName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (me) {
      setName(me.name);
      setClinicName(me.clinicName);
      setPhone(me.phone);
      setAddress(me.address);
    }
  }, [me]);

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    updateMe.mutate(
      { data: { name, clinicName, phone, address } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Profile saved", description: "Your details have been updated." });
        },
        onError: () =>
          toast({
            title: "Could not save",
            description: "Please try again.",
            variant: "destructive",
          }),
      },
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
          <p className="text-sm text-muted-foreground">This appears on your patient records.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl bg-card border border-card-border shadow-sm p-5 sm:p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 rounded-lg border border-input bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="Dr. Aman Gupta"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Clinic name</label>
          <input
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            className="w-full h-12 rounded-lg border border-input bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="Sehat Clinic"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-12 rounded-lg border border-input bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="+91 …"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Clinic address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-base outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-none"
            placeholder="Street, area, city"
          />
        </div>

        <button
          type="submit"
          disabled={updateMe.isPending}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold shadow-md hover-elevate active-elevate-2 inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {updateMe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </form>

      {me?.email && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Signed in as <span className="font-medium text-foreground">{me.email}</span>
        </p>
      )}
    </div>
  );
}
