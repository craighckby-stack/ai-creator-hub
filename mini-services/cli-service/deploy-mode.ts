// Add this deployment mode to CLI service main menu

const DEPLOY_MENU = `
╔════════════════════════════════════════════════════════════════════╗
║                    DEPLOY TO GITHUB                          ║
╠════════════════════════════════════════════════════════════╣
║                                                               ║
║  This will deploy Evolution Engine + RAG + Scraper  ║
║  to a new GitHub repository with author attribution.     ║
║                                                               ║
║  Select an option (1-4):                                    ║
║                                                               ║
║  [1] 🚀 RUN DEPLOYMENT SCRIPT                            ║
║      Execute deplay.ts which will:                    ║
║      • Create GitHub repo                              ║
║      • Upload ALL source files                         ║
║      • Run build tests                                  ║
║      • Set author to Craig Huckerby                      ║
║      • Commit and push to GitHub                       ║
║                                                               ║
║  [2] 📝 VIEW DEPLOYMENT SETTINGS                      ║
║      Show repo name and description                   ║
║                                                               ║
║  [3] 🔍 TEST DEPLOYMENT ONLY                            ║
║      Run build tests without uploading                ║
║                                                               ║
║  [4] 🔙 BACK TO MAIN MENU                                     ║
║                                                               ║
╚════════════════════════════════════════════════════════════════════════╝

> `;

// Add deploy mode to CLI main menu
const main = `
... existing content ...
║  [6] 🚀 DEPLOY TO GITHUB                                   ║
║  [7] ❓ Help - List All Options                               ║
...
`;

// Add deploy menu handler
async function handleDeployMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      await runDeploymentScript(session);
      break;
    case 2:
      showDeploymentSettings(session);
      break;
    case 3:
      await runBuildTestsOnly(session);
      break;
    case 4:
      session.currentMenu = 'main';
      showMenu(session, 'main');
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-4.');
      sendToCLI(session, '> ');
  }
}

async function runDeploymentScript(session: CLISession) {
  sendToCLI(session, '\n🚀 Running deployment script...\n');
  sendToCLI(session, 'Executing: bun run deplay.ts\n');
  
  try {
    const result = execSync('bun run deplay.ts', {
      encoding: 'utf-8',
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    sendToCLI(session, '\n✓ Deployment script completed\n');
    sendToCLI(session, 'Check output above for deployment status\n');
    
  } catch (error) {
    sendToCLI(session, `\n❌ Deployment script failed: ${error}\n`);
  }
  
  showMenu(session, 'deploy');
}

async function runBuildTestsOnly(session: CLISession) {
  sendToCLI(session, '\n🧪 Running build tests only...\n');
  
  try {
    const result = execSync('bun run build', {
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    const errors: string[] = [];
    const lines = (result.stdout || '').split('\n');
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('error') ||
          line.toLowerCase().includes('failed') ||
          line.toLowerCase().includes('missing')) {
        errors.push(line);
      }
    });
    
    sendToCLI(session, `\n${'='.repeat(60)}\n`);
    sendToCLI(session, `║                    BUILD TEST RESULTS                     ║`);
    sendToCLI(session, `║                                                               ║`);
    sendToCLI(session, `║  Status: ${errors.length === 0 ? '✓ PASSED' : '✗ FAILED'}           ║`);
    sendToCLI(session, `║  Errors Found: ${errors.length}                                ║`);
    sendToCLI(session, `║                                                               ║`);
    
    if (errors.length > 0) {
      sendToCLI(session, `║  Errors:                                                     ║`);
      errors.slice(0, 5).forEach((err, i) => {
        sendToCLI(session, `║  [${i + 1}] ${err.substring(0, 60)}${err.length > 60 ? '...' : ''}      ║`);
      });
      if (errors.length > 5) {
        sendToCLI(session, `║  ... and ${errors.length - 5} more errors                    ║`);
      }
    } else {
      sendToCLI(session, `║  No errors detected - Build is clean!                 ║`);
    }
    
    sendToCLI(session, `║                                                               ║`);
    sendToCLI(session, `║  [6] 🔙 BACK TO DEPLOY MENU                                ║`);
    sendToCLI(session, `║                                                               ║`);
    sendToCLI(session, `╠════════════════════════════════════════════════════════╣`);
    sendToCLI(session, `║                                                               ║`);
    sendToCLI(session, `> `);
    
  } catch (error) {
    sendToCLI(session, `\n❌ Build testing failed: ${error}\n`);
    showMenu(session, 'deploy');
  }
}
