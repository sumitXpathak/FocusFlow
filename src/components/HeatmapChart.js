import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../constants/theme';

// A simple Github-style activity heatmap
// Maps a flat array of 28-31 days of intensity values to a grid.
export default function HeatmapChart({ data, monthLabel }) {
  // data is array of objects { day: 1-31, intensity: 0-4 }
  // To keep it simple, we render a grid of 7 rows (days of week) x 5 columns (weeks)

  const numWeeks = 5;
  const daysPerWeek = 7;
  const grid = Array(daysPerWeek).fill(0).map(() => Array(numWeeks).fill(null));

  let dataIndex = 0;
  for (let c = 0; c < numWeeks; c++) {
    for (let r = 0; r < daysPerWeek; r++) {
      if (dataIndex < data.length) {
        grid[r][c] = data[dataIndex];
        dataIndex++;
      }
    }
  }

  function getColor(intensity) {
    switch (intensity) {
      case 4: return COLORS.orange;
      case 3: return COLORS.orangeLight;
      case 2: return '#FFDDB3'; // Lighter orange
      case 1: return '#FFF0D9'; // Very light orange
      default: return COLORS.grayLight;
    }
  }

  return (
    <View style={styles.container}>
      {monthLabel && <Text style={styles.label}>{monthLabel}</Text>}
      <View style={styles.grid}>
        {grid.map((row, rIndex) => (
          <View key={`r-${rIndex}`} style={styles.row}>
            {row.map((cell, cIndex) => (
              <View
                key={`c-${cIndex}`}
                style={[
                  styles.cell,
                  { backgroundColor: cell ? getColor(cell.intensity) : 'transparent' }
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={[styles.legendCell, { backgroundColor: getColor(0) }]} />
        <View style={[styles.legendCell, { backgroundColor: getColor(1) }]} />
        <View style={[styles.legendCell, { backgroundColor: getColor(2) }]} />
        <View style={[styles.legendCell, { backgroundColor: getColor(3) }]} />
        <View style={[styles.legendCell, { backgroundColor: getColor(4) }]} />
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: {
    fontSize: 12, fontWeight: '600', color: COLORS.gray, marginBottom: 12,
  },
  grid: {
    flexDirection: 'column', gap: 4,
  },
  row: {
    flexDirection: 'row', gap: 4,
  },
  cell: {
    width: 24, height: 24, borderRadius: 4,
  },
  legend: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16,
  },
  legendText: {
    fontSize: 10, color: COLORS.gray, marginHorizontal: 4,
  },
  legendCell: {
    width: 12, height: 12, borderRadius: 2,
  }
});
