/**
 * Luna's custom SVG icon set — drawn on a 24×24 grid, 1.7 stroke, round joins.
 * Kept in one file so the visual language stays consistent.
 */
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export type IconProps = { size?: number; color: string; strokeWidth?: number };

// position: 'relative' keeps icons above absolutely-positioned glass layers on web (native ignores it).
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const, style: { position: 'relative' as const } });
const s = (color: string, w = 1.7) => ({ stroke: color, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

const DROP = 'M12 3.2c3.6 4.3 6.2 7.7 6.2 10.8a6.2 6.2 0 0 1-12.4 0c0-3.1 2.6-6.5 6.2-10.8z';

export const Icons = {
  drop: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}><Path d={DROP} {...s(color, strokeWidth)} /></Svg>
  ),
  dropFilled: ({ size = 24, color }: IconProps) => (
    <Svg {...base(size)}>
      <Path d={DROP} fill={color} />
      <Path d="M9.2 13.6a3 3 0 0 0 2 2.8" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  ),
  cramps: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M4.5 6.5c.4-1.6 2.3-1.9 3.1-.7.6.9 1.2 2.2 2.6 2.2h3.6c1.4 0 2-1.3 2.6-2.2.8-1.2 2.7-.9 3.1.7.4 1.6-1 2.8-2.6 3.5-.6 1.6-1.6 3.1-2.8 3.8v4.4a2 2 0 0 1-4 0v-4.4c-1.2-.7-2.2-2.2-2.8-3.8-1.6-.7-3-1.9-2.6-3.5z" {...s(color, strokeWidth)} />
      <Path d="M12.6 9.6l-1.4 2h1.8l-1.4 2" {...s(color, 1.4)} />
    </Svg>
  ),
  headache: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M7 20v-2.2A6.5 6.5 0 1 1 17.6 13l1.2 2.6h-1.8V18a2 2 0 0 1-2 2h-1" {...s(color, strokeWidth)} />
      <Path d="M8.5 6.5l1.2 1.6 1.4-1.8 1.3 1.8 1.4-1.6" {...s(color, 1.4)} />
    </Svg>
  ),
  bloating: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M8 3.5V7c-2.2 1.6-3.5 4-3.5 6.5a7.5 7.5 0 0 0 15 0c0-2.5-1.3-4.9-3.5-6.5V3.5" {...s(color, strokeWidth)} />
      <Circle cx={12} cy={14} r={0.9} fill={color} />
      <Path d="M2.5 12.5l-1 1.2 1 1.3M21.5 12.5l1 1.2-1 1.3" {...s(color, 1.3)} />
    </Svg>
  ),
  back: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      {[4, 8.5, 13, 17.5].map((y, i) => (
        <Rect key={y} x={i === 2 ? 8.5 : 9} y={y} width={i === 2 ? 7 : 6} height={3} rx={1.5} {...s(color, strokeWidth)} />
      ))}
      <Path d="M18.5 13.5l1.5-1-1-1.5 1.5-1" {...s(color, 1.3)} />
    </Svg>
  ),
  breast: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M12 20s-7-4.3-7-9.5A3.8 3.8 0 0 1 12 8.3a3.8 3.8 0 0 1 7 2.2C19 15.7 12 20 12 20z" {...s(color, strokeWidth)} />
      <Path d="M12 2.5v2M7 3.8l1 1.6M17 3.8l-1 1.6" {...s(color, 1.3)} />
    </Svg>
  ),
  acne: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Circle cx={12} cy={12} r={8.5} {...s(color, strokeWidth)} />
      <Circle cx={9} cy={10} r={1.1} fill={color} />
      <Circle cx={15} cy={9} r={0.8} fill={color} />
      <Circle cx={14.5} cy={14.5} r={1.2} fill={color} />
      <Circle cx={9.5} cy={15.5} r={0.7} fill={color} />
    </Svg>
  ),
  fatigue: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Rect x={3} y={8} width={16} height={9} rx={2.5} {...s(color, strokeWidth)} />
      <Path d="M21.5 11v3" {...s(color, strokeWidth)} />
      <Rect x={5.5} y={10.5} width={3} height={4} rx={1} fill={color} />
    </Svg>
  ),
  nausea: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Circle cx={12} cy={12} r={8.5} {...s(color, strokeWidth)} />
      <Path d="M8 10.2c.6-.6 1.4-.6 2 0M14 10.2c.6-.6 1.4-.6 2 0" {...s(color, 1.4)} />
      <Path d="M8.5 15.5c1-1 2-1 3 0s2 1 3 0 1.5-.7 2 0" {...s(color, 1.4)} />
    </Svg>
  ),
  cravings: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M20.5 12.5A8.5 8.5 0 1 1 11.5 3.5a3 3 0 0 0 4 3 3 3 0 0 0 5 6z" {...s(color, strokeWidth)} />
      <Circle cx={9} cy={10} r={1} fill={color} />
      <Circle cx={13} cy={15} r={1} fill={color} />
      <Circle cx={8.5} cy={15.5} r={0.8} fill={color} />
    </Svg>
  ),
  insomnia: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M19 14.5A7.5 7.5 0 1 1 10 4.6a6 6 0 0 0 9 9.9z" {...s(color, strokeWidth)} />
      <Path d="M15 3.5h3l-3 3.5h3" {...s(color, 1.3)} />
    </Svg>
  ),
  dizzy: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M12 12.2c0-.6.5-.9 1-.7.9.3 1.1 1.6.4 2.4-1 1.1-2.9.9-3.6-.4-1-1.7.2-3.9 2.1-4.2 2.5-.4 4.6 1.8 4.3 4.3-.3 3.1-3.6 5-6.5 4-3.5-1.2-4.9-5.5-3-8.6" {...s(color, strokeWidth)} />
    </Svg>
  ),
  spotting: ({ size = 24, color }: IconProps) => (
    <Svg {...base(size)}>
      <Circle cx={8} cy={9} r={1.8} fill={color} />
      <Circle cx={15.5} cy={7.5} r={1.3} fill={color} />
      <Circle cx={13} cy={14} r={2.2} fill={color} />
      <Circle cx={7.5} cy={16.5} r={1.1} fill={color} />
    </Svg>
  ),
  hot: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M12 21c3.5 0 6-2.4 6-5.8 0-3.6-3.2-5.6-3.8-9.7-2.4 1.6-3.4 3.8-3.4 5.6-1-.6-1.6-1.6-1.8-2.8C7.4 10 6 12.4 6 15.2 6 18.6 8.5 21 12 21z" {...s(color, strokeWidth)} />
    </Svg>
  ),
  chills: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" {...s(color, strokeWidth)} />
      <Path d="M9.8 4.2L12 6l2.2-1.8M9.8 19.8L12 18l2.2 1.8" {...s(color, 1.3)} />
    </Svg>
  ),
  calendar: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Rect x={3.5} y={5} width={17} height={15.5} rx={4} {...s(color, strokeWidth)} />
      <Path d="M8 3v4M16 3v4M3.5 10h17" {...s(color, strokeWidth)} />
      <Circle cx={12} cy={15} r={1.4} fill={color} />
    </Svg>
  ),
  pen: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M4 20l1-4.2L15.6 5.2a2.1 2.1 0 0 1 3 3L8 18.8 4 20z" {...s(color, strokeWidth)} />
      <Path d="M13.5 7.3l3 3" {...s(color, strokeWidth)} />
    </Svg>
  ),
  sparkle: ({ size = 24, color }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5z" fill={color} />
      <Path d="M19 15.5c.3 1.9 1.1 2.7 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3z" fill={color} opacity={0.6} />
    </Svg>
  ),
  shield: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6L12 3z" {...s(color, strokeWidth)} />
      <Path d="M8.8 12.2l2.2 2.2 4.4-4.6" {...s(color, strokeWidth)} />
    </Svg>
  ),
  lock: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Rect x={5} y={10.5} width={14} height={10} rx={3} {...s(color, strokeWidth)} />
      <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...s(color, strokeWidth)} />
      <Circle cx={12} cy={15.5} r={1.3} fill={color} />
    </Svg>
  ),
  trash: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M4 7h16M9.5 7V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3V7M6.5 7l.9 11.6c.1 1.1 1 1.9 2 1.9h5.2c1 0 1.9-.8 2-1.9L17.5 7" {...s(color, strokeWidth)} />
      <Path d="M10.2 11v5.5M13.8 11v5.5" {...s(color, strokeWidth)} />
    </Svg>
  ),
  bell: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2zM10 20.5a2.2 2.2 0 0 0 4 0" {...s(color, strokeWidth)} />
    </Svg>
  ),
  eyeOff: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Path d="M3 12s3.3-6 9-6c1.6 0 3 .5 4.2 1.2M21 12s-3.3 6-9 6c-1.6 0-3-.5-4.2-1.2" {...s(color, strokeWidth)} />
      <Path d="M4 20L20 4" {...s(color, strokeWidth)} />
    </Svg>
  ),
  phone: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}>
      <Rect x={6.5} y={2.5} width={11} height={19} rx={3} {...s(color, strokeWidth)} />
      <Path d="M10.5 18.5h3" {...s(color, strokeWidth)} />
    </Svg>
  ),
  plus: ({ size = 24, color, strokeWidth }: IconProps) => (
    <Svg {...base(size)}><Path d="M12 5v14M5 12h14" {...s(color, strokeWidth ?? 2)} /></Svg>
  ),
};

export type IconName = keyof typeof Icons;

export function Icon({ name, ...p }: IconProps & { name: IconName }) {
  const C = Icons[name];
  return <C {...p} />;
}

/** One, two or three drops — used for flow intensity tiles. */
export function FlowDrops({ level, color, size = 34 }: { level: 1 | 2 | 3; color: string; size?: number }) {
  const pos = level === 1 ? [[12, 12, 1]] : level === 2 ? [[8.5, 13, 0.82], [15.5, 11, 0.82]] : [[7, 14.5, 0.7], [17, 14.5, 0.7], [12, 8.5, 0.7]];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'relative' }}>
      {pos.map(([x, y, k], i) => (
        <G key={i} transform={`translate(${x - 12 * k} ${y - 12 * k}) scale(${k})`}>
          <Path d={DROP} fill={color} />
          <Path d="M9.2 13.6a3 3 0 0 0 2 2.8" stroke="#fff" strokeOpacity={0.65} strokeWidth={1.6} strokeLinecap="round" />
        </G>
      ))}
    </Svg>
  );
}

/** Brand mark + hero illustration: a layered bloom with a crescent core. */
export function Bloom({ size = 180, colors }: { size?: number; colors: [string, string, string] }) {
  const petals = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="pa" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
        <LinearGradient id="pb" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors[1]} stopOpacity={0.9} />
          <Stop offset="1" stopColor={colors[2]} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>
      <G opacity={0.55}>
        {petals.map((a) => (
          <Ellipse key={`o${a}`} cx={100} cy={52} rx={30} ry={50} fill="url(#pb)" transform={`rotate(${a + 30} 100 100)`} />
        ))}
      </G>
      {petals.map((a) => (
        <Ellipse key={a} cx={100} cy={62} rx={22} ry={40} fill="url(#pa)" opacity={0.85} transform={`rotate(${a} 100 100)`} />
      ))}
      <Circle cx={100} cy={100} r={26} fill="#fff" opacity={0.9} />
      <Path d="M110 88a16 16 0 1 0 0 24 13 13 0 1 1 0-24z" fill={colors[2]} />
    </Svg>
  );
}
