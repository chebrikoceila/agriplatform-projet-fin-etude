import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Parcelle } from "./types";

interface Props {
  open: boolean;
  parcelle: Parcelle | null;
  onCancel: () => void;
  onConfirm: (id: string, data: Partial<Parcelle>) => Promise<void>;
}

export const EditParcelleDialog = ({ open, parcelle, onCancel, onConfirm }: Props) => {
  const [nom, setNom] = useState("");
  const [cultureType, setCultureType] = useState("");
  const [datePlantation, setDatePlantation] = useState("");
  const [proprietaire, setProprietaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);

  const toDateInput = (raw?: string) => {
    if (!raw) return "";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (open && parcelle) {
      setNom(parcelle.nom || "");
      setCultureType(parcelle.cultureType || "");
      setDatePlantation(toDateInput(parcelle.datePlantation));
      setProprietaire(parcelle.proprietaire || "");
    }
  }, [open, parcelle]);

  const handleSubmit = async () => {
    if (!parcelle || !nom.trim() || !proprietaire.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(parcelle._id, {
        nom: nom.trim(),
        cultureType: cultureType.trim(),
        proprietaire: proprietaire.trim(),
        datePlantation,
      });
      onCancel();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la parcelle</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de la parcelle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-nom">Nom de la parcelle</Label>
            <Input id="edit-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Champ Nord 1" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-culture">Type de culture</Label>
            <Input id="edit-culture" value={cultureType} onChange={(e) => setCultureType(e.target.value)} placeholder="Blé tendre, Olivier…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-datePlantation">Date de semis / plantation</Label>
            <Input
              id="edit-datePlantation"
              type="date"
              max={todayIso}
              value={datePlantation}
              onChange={(e) => setDatePlantation(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-proprio">Propriétaire</Label>
            <Input id="edit-proprio" value={proprietaire} onChange={(e) => setProprietaire(e.target.value)} placeholder="Nom du propriétaire" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting || !nom.trim() || !proprietaire.trim()}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
