import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { StretchingPerson } from '../components/illustrations';
import { AvatarMark } from '../components/ui/AvatarMark';

export function Treino() {
  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Treino</h1>

      <Card>
        <EmptyState
          illustration={
            <AvatarMark accentColor="var(--color-science)" size={48}>
              <StretchingPerson size={32} />
            </AvatarMark>
          }
          title="Nenhuma ficha criada"
          description="Seus treinos aparecerão aqui."
        />
      </Card>
    </div>
  );
}
