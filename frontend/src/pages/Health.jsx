import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import { Cpu, HardDrive, CircuitBoard } from 'lucide-react';

function Health() {
  const systemStats = [
    { 
      name: 'CPU 사용량', 
      value: 45, 
      icon: <Cpu size={20} />,
      color: '#2196F3'
    },
    { 
      name: '메모리 사용량', 
      value: 72, 
      icon: <CircuitBoard size={20} />,
      color: '#4CAF50'
    },
    { 
      name: '디스크 사용량', 
      value: 60, 
      icon: <HardDrive size={20} />,
      color: '#FF9800'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        시스템 상태
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {systemStats.map((stat) => (
          <Paper key={stat.name} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ color: stat.color }}>{stat.icon}</Box>
              <Typography variant="h6">{stat.name}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={stat.value}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#eee',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: stat.color
                    }
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ minWidth: 35 }}>
                {stat.value}%
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

export default Health; 