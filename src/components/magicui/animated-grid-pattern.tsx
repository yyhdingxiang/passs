export function AnimatedGridPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] [background-size:28px_28px] animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
    </div>
  );
}
