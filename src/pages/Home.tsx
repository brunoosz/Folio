import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ExercisingPerson } from '../components/illustrations';
import { AvatarMark } from '../components/ui/AvatarMark';

export function Home() {
  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Início</h1>

      <Card>
        <EmptyState
          illustration={
            <AvatarMark accentColor="var(--color-muscle)" size={48}>
              <ExercisingPerson size={32} />
            </AvatarMark>
          }
          title="Nenhum treino hoje"
          description="Configure sua ficha na aba Treino para começar."
        />
      </Card>
    </div>
  );
}
