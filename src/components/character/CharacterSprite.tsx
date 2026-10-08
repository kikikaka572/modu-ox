import { characterById } from "@/components/character/characterCatalog";
import { colorById } from "@/components/character/colorPalette";
import { cn } from "@/lib/cn";

export type AnimationState = "idle" | "walk" | "cheer" | "eliminated";

interface CharacterSpriteProps {
  characterId: number;
  colorId: number;
  animationState?: AnimationState;
  size?: number;
  reducedMotion?: boolean;
  className?: string;
}

const ANIMATION_CLASS: Record<AnimationState, string> = {
  idle: "char-idle",
  walk: "char-walk",
  cheer: "char-cheer",
  eliminated: "char-eliminated",
};

export function CharacterSprite({
  characterId,
  colorId,
  animationState = "idle",
  size = 72,
  reducedMotion = false,
  className,
}: CharacterSpriteProps) {
  const character = characterById(characterId);
  const color = colorById(colorId);
  const Icon = character.Icon;

  return (
    <div
      className={cn(!reducedMotion && ANIMATION_CLASS[animationState], className)}
      style={{
        width: size,
        height: size,
        // @ts-expect-error -- CSS custom properties aren't in React's style type
        "--char-body": color.body,
        "--char-accent": color.accent,
        "--char-belly": color.belly,
      }}
    >
      <Icon />
    </div>
  );
}
