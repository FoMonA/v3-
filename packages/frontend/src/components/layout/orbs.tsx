export function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute -top-[100px] right-[10%] size-[180px] sm:size-[400px] rounded-full bg-secondary blur-[80px] opacity-40 animate-[orb-float_8s_ease-in-out_infinite]" />
      <div className="absolute -bottom-[80px] left-[5%] size-[150px] sm:size-[350px] rounded-full bg-primary blur-[80px] opacity-40 animate-[orb-float_10s_ease-in-out_infinite_reverse]" />
      <div className="absolute top-[40%] left-[40%] size-[120px] sm:size-[280px] rounded-full bg-accent blur-[80px] opacity-40 animate-[orb-float_12s_ease-in-out_infinite_2s]" />
    </div>
  );
}
