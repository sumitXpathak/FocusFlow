import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/theme';

export default function ScreenTimeRing({ percent = 0, timeStr = '' }) {
  const RADIUS = 44;
  const CIRC = 2 * Math.PI * RADIUS;
  const filled = CIRC * (percent / 100);
  const color = percent >= 100 ? COLORS.red : percent >= 80 ? COLORS.orange : COLORS.orange;

  return (
    <View style={{ width: 105, height: 105 }}>
      <Svg width={105} height={105} viewBox="0 0 105 105">
        <Circle cx={52.5} cy={52.5} r={RADIUS} fill="none" stroke={COLORS.grayLight} strokeWidth={12} />
        <Circle
          cx={52.5} cy={52.5} r={RADIUS} fill="none"
          stroke={color} strokeWidth={12}
          strokeDasharray={`${filled} ${CIRC}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          rotation={-90} origin="52.5, 52.5"
        />
        <SvgText x={52.5} y={50} textAnchor="middle" fontSize={13} fontWeight="700" fill={COLORS.black}>
          {timeStr}
        </SvgText>
        <SvgText x={52.5} y={63} textAnchor="middle" fontSize={9} fill={COLORS.gray}>
          used today
        </SvgText>
      </Svg>
    </View>
  );
}
