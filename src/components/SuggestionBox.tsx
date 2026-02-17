import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const SuggestionBox = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = () => {
    const trimmed = suggestion.trim();
    if (!trimmed || trimmed.length < 10) {
      toast({ title: 'Escribe al menos 10 caracteres', variant: 'destructive' });
      return;
    }
    if (trimmed.length > 1000) {
      toast({ title: 'Máximo 1000 caracteres', variant: 'destructive' });
      return;
    }

    setSending(true);

    // Store locally (could be sent to a backend later)
    const suggestions = JSON.parse(localStorage.getItem('zbe-suggestions') || '[]');
    suggestions.push({
      name: name.trim().slice(0, 100) || 'Anónimo',
      text: trimmed,
      date: new Date().toISOString(),
    });
    localStorage.setItem('zbe-suggestions', JSON.stringify(suggestions));

    setTimeout(() => {
      setSending(false);
      setName('');
      setSuggestion('');
      setOpen(false);
      toast({ title: '¡Gracias por tu sugerencia!', description: 'La tendremos en cuenta para futuras mejoras.' });
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Buzón de sugerencias
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Buzón de sugerencias
          </DialogTitle>
          <DialogDescription>
            ¿Tienes ideas para mejorar la app? ¡Cuéntanos!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input
            placeholder="Tu nombre (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
          <Textarea
            placeholder="Describe tu sugerencia o mejora..."
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            maxLength={1000}
            className="min-h-[120px] resize-none"
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {suggestion.length}/1000
          </p>
          <Button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full"
          >
            {sending ? 'Enviando...' : 'Enviar sugerencia'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionBox;
