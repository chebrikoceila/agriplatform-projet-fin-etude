import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatHa, polygonAreaHa } from "./utils";
import type { ParcelleGeometry } from "./types";

interface Props {
  open: boolean;
  geometry: ParcelleGeometry | null;
  onCancel: () => void;
  onConfirm: (data: { nom: string; cultureType: string; proprietaire: string; datePlantation: string }) => Promise<void>;
}

export const CreateParcelleDialog = ({ open, geometry, onCancel, onConfirm }: Props) => {
  const [nom, setNom] = useState("");
  const [cultureType, setCultureType] = useState("");
  const [datePlantation, setDatePlantation] = useState("");
  const [proprietaire, setProprietaire] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNom("");
      setCultureType("");
      setDatePlantation("");
      setProprietaire("");
    }
  }, [open]);

  const surface = geometry ? polygonAreaHa(geometry) : 0;
  const todayIso = new Date().toISOString().slice(0, 10);

  const handleSubmit = async () => {
    if (!nom.trim() || !proprietaire.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm({ nom: nom.trim(), cultureType: cultureType.trim(), proprietaire: proprietaire.trim(), datePlantation });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle parcelle</DialogTitle>
          <DialogDescription>
            Surface estimée : <span className="font-medium text-foreground">{formatHa(surface)}</span>.
            Le calcul des indices (NDVI / NDWI) démarrera automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom de la parcelle</Label>
            <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Champ Nord 1" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="culture">Type de culture</Label>
            <Input id="culture" value={cultureType} onChange={(e) => setCultureType(e.target.value)} placeholder="Blé tendre, Olivier…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="datePlantation">Date de semis / plantation</Label>
            <Input
              id="datePlantation"
              type="date"
              max={todayIso}
              value={datePlantation}
              onChange={(e) => setDatePlantation(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proprio">Propriétaire</Label>
            <Input id="proprio" value={proprietaire} onChange={(e) => setProprietaire(e.target.value)} placeholder="Nom du propriétaire" />
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
