export default function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-neutral-500">
          Coming in <span className="font-semibold text-neutral-700">{phase}</span>.
        </p>
      </div>
    </div>
  );
}
