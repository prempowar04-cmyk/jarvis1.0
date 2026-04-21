import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();

app.use(cors());
app.use(express.json());

// List of process names to NEVER kill (Safety Protocol)
const SAFE_PROCESSES = ['node', 'Code', 'chrome', 'vite', 'pwsh', 'explorer', 'cmd', 'git'];

app.post('/api/sys/execute', async (req, res) => {
  const { command, payload } = req.body;

  try {
    console.log(`[Premex Server] Received command: ${command}`);

    if (command === 'CLOSE_APPS') {
      // Closes apps that have a Main Window Title, excluding essential dev tools and chrome
      const safeRegex = SAFE_PROCESSES.join('|');
      const psCommand = `Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Where-Object {$_.ProcessName -notmatch "${safeRegex}"} | Stop-Process -Force`;
      
      try {
        await execAsync(`powershell.exe -Command "${psCommand}"`);
        res.json({ success: true, message: 'Extraneous applications have been terminated.' });
      } catch (err) {
        // Stop-Process throws if there's nothing to stop or permission denied on some
        res.json({ success: true, message: 'Apps closed with minor permission warnings.', error: err.message });
      }
    } 
    
    else if (command === 'SET_ALARM') {
      const minutes = parseInt(payload.mins, 10);
      if (isNaN(minutes)) throw new Error("Invalid time format");
      
      console.log(`[Premex Server] Setting alarm for ${minutes} minutes.`);
      
      // Schedule background timeout
      setTimeout(() => {
        console.log(`[Premex Server] ALARM TRIGGERED!`);
        // Play default Windows alarm sound asynchronously
        exec(`powershell.exe -c "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Alarm01.wav').PlaySync()"`);
      }, minutes * 60 * 1000);

      res.json({ success: true, message: `Alarm activated for ${minutes} minutes from now.` });
    }
    
    else {
      res.status(400).json({ success: false, error: 'Unknown command type' });
    }

  } catch (error) {
    console.error(`[Premex Server] Error executing payload:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[Premex Local Link] Server online on port ${PORT}`);
});
