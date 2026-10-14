import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { RestingPerson } from '../components/illustrations';
import { AvatarMark } from '../components/ui/AvatarMark';

export function Mapa() {
  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Mapa muscular</h1>

      <Card>
        <EmptyState
          illustration={
            <AvatarMark accentColor="var(--color-routine)" size={48}>
              <RestingPerson size={32} />
            </AvatarMark>
          }
          title="Mapa em construção"
          description="O mapa muscular 2D estará disponível em breve."
        />
      </Card>
    </div>
  );
}
