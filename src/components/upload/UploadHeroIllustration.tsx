import { UserRound, SquareCheckBig, CloudLightning, Clock, Settings } from "lucide-react";

const ORBIT_BADGES = [
  { Icon: SquareCheckBig, className: "left-0 top-[26%] -translate-x-1/2" },
  { Icon: CloudLightning, className: "right-0 top-[58%] translate-x-1/2" },
  { Icon: Clock, className: "right-[10%] top-0 -translate-y-1/2" },
  { Icon: Settings, className: "left-[20%] bottom-0 translate-y-1/2" },
];

/**
 * Decorative illustration on the upload screen (Figma: "Frame 1618872259") —
 * concentric rings around a person icon, with small orbiting icon badges.
 * Uses an icon instead of a photo since this no-auth app has no real user
 * image to show (see docs/DECISIONS.md).
 */
export function UploadHeroIllustration() {
  return (
    <div className="relative flex size-[138px] shrink-0 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-danger-tint" />
      <div className="absolute inset-[15px] rounded-full bg-brand-orange/20" />
      <div className="relative flex size-[97px] items-center justify-center rounded-full bg-brand-orange/10">
        <UserRound className="size-10 text-brand-orange" />
      </div>
      {ORBIT_BADGES.map(({ Icon, className }, index) => (
        <div
          key={index}
          className={`absolute flex size-7 items-center justify-center rounded-full bg-surface-white shadow-realistic ${className}`}
        >
          <Icon className="size-3.5 text-ink-secondary" />
        </div>
      ))}
    </div>
  );
}
