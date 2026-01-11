import { Server } from 'socket.io';
import { createServer } from 'http';

const PORT = 3001;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// CLI State
interface CLISession {
  socket: any;
  mode: 'menu' | 'input' | 'search' | 'build' | 'agi';
  menuStack: string[];
  currentMenu: 'main' | 'configure' | 'search' | 'build' | 'agi';
  userData: any;
  projectData: any;
}

const sessions = new Map<string, CLISession>();

// Menus
const MENUS = {
  main: `
╔════════════════════════════════════════════════════════════╗
║              EVOLUTION ENGINE - CLI INTERFACE v1.0              ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Select an option (1-5):                                    ║
║                                                               ║
║  [1] 🚀 Create New Project                                    ║
║  [2] 🔍 Search for AGI Concepts / Repos                      ║
║  [3] ⚙️  Configure Settings                                     ║
║  [4] 🤖 Create AGI System                                    ║
║  [5] ❓ Help - List All Options                               ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `,
  
  configure: `
╔════════════════════════════════════════════════════════════╗
║                   CONFIGURATION MENU                                 ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Select an option (1-6):                                    ║
║                                                               ║
║  [1] 👤 User Profile Information                               ║
║  [2] 🔑 API Keys (GitHub, Gemini)                             ║
║  [3] 📦 GitHub Repository Settings                            ║
║  [4] 🎨 Technology Stack Preferences                          ║
║  [5] 📊 Experience Level                                      ║
║  [6] 🔙 Back to Main Menu                                     ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `,
  
  search: `
╔════════════════════════════════════════════════════════════╗
║                      SEARCH MENU                                  ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Select an option (1-5):                                    ║
║                                                               ║
║  [1] 🌐 Search AGI Concepts (Google)                         ║
║  [2] 📚 Search GitHub Repositories                             ║
║  [3] 🔗 Search Your Repositories                               ║
║  [4] 📋 View Found Repositories                              ║
║  [5] 🔙 Back to Main Menu                                   ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `,
  
  build: `
╔════════════════════════════════════════════════════════════╗
║                      BUILD MENU                                    ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Select an option (1-6):                                    ║
║                                                               ║
║  [1] 📋 View Build Instructions                               ║
║  [2] ▶️  Start Building Project                               ║
║  [3] 📊 View Project Status                                  ║
║  [4] 📝 View Upload Files                                   ║
║  [5] 🔄 Reset Project                                       ║
║  [6] 🔙 Back to Main Menu                                   ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `,
  
  agi: `
╔════════════════════════════════════════════════════════════╗
║                     CREATE AGI SYSTEM                              ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  This will search, aggregate, and create a complete AGI system    ║
║  from relevant GitHub repositories.                                  ║
║                                                               ║
║  Select an option (1-4):                                    ║
║                                                               ║
║  [1] 🔍 Find AGI-Related Repositories                         ║
║  [2] 📦 Aggregate Selected Repositories                        ║
║  [3] 🚀 Generate AGI Build Instructions                     ║
║  [4] 🔙 Back to Main Menu                                   ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> `
};

// Help Text
const HELP_TEXT = `
╔════════════════════════════════════════════════════════════╗
║                        COMMAND HELP                               ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  AVAILABLE COMMANDS:                                           ║
║  ───────────────────────────────────────────────────────────────    ║
║                                                               ║
║  help, ?          Show this help screen                         ║
║  menu             Return to main menu                           ║
║  clear            Clear the screen                               ║
║  status           Show current system status                      ║
║  reset            Reset the entire system                         ║
║  exit             Exit CLI (returns to web UI)                  ║
║                                                               ║
║  NAVIGATION:                                                   ║
║  ───────────                                                  ║
║  1-5              Select menu option by number                  ║
║  1-6              Select submenu option by number                ║
║  ESC               Return to previous menu                     ║
║  Tab               Auto-complete commands                       ║
║                                                               ║
║  PROJECT WORKFLOW:                                             ║
║  ─────────────────                                        ║
║                                                               ║
║  1. Select [1] Create New Project                           ║
║  2. Choose project type (Quantum OS, Book Writer, etc.)    ║
║  3. Describe your project                                      ║
║  4. Upload relevant files (.bin, .pdf, .json, .zip)        ║
║  5. System searches GitHub for relevant repositories            ║
║  6. AI generates build instructions                         ║
║  7. Start building project                                    ║
║                                                               ║
║  AGI CREATION WORKFLOW:                                        ║
║  ────────────────────────                                    ║
║                                                               ║
║  1. Select [4] Create AGI System                            ║
║  2. Search for AGI concepts and repositories                 ║
║  3. Select repositories to aggregate                         ║
║  4. System combines them into one AGI system               ║
║  5. Generate complete build instructions                     ║
║                                                               ║
║  CONFIGURATION:                                                ║
║  ─────────────                                            ║
║                                                               ║
║  • User Profile: Name, email, company, role                  ║
║  • API Keys: GitHub token, Gemini API key                      ║
║  • GitHub Repo: Name of your learning repository               ║
║  • Tech Stack: Preferred technologies                         ║
║  • Experience: Beginner, Intermediate, Expert                   ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

Press any key to continue...
> `;

// Project Types
const PROJECT_TYPES = [
  { id: 'quantum-os', name: 'Quantum Operating System', emoji: '⚛️' },
  { id: 'book-writer', name: 'Book Writer Assistant', emoji: '📖' },
  { id: 'ai-chatbot', name: 'AI Chatbot System', emoji: '🤖' },
  { id: 'e-commerce', name: 'E-commerce Platform', emoji: '🛒' },
  { id: 'dashboard', name: 'Analytics Dashboard', emoji: '📊' },
  { id: 'custom', name: 'Custom Project', emoji: '🔧' }
];

// Initialize session
function createSession(socket: any): CLISession {
  return {
    socket,
    mode: 'menu',
    menuStack: [],
    currentMenu: 'main',
    userData: null,
    projectData: null
  };
}

// Send output to CLI
function sendToCLI(session: CLISession, text: string, clear = false) {
  if (clear) {
    session.socket.emit('cli-clear');
  }
  session.socket.emit('cli-output', text);
}

// Show menu
function showMenu(session: CLISession) {
  const menu = MENUS[session.currentMenu as keyof typeof MENUS];
  sendToCLI(session, menu, true);
}

// Handle input
async function handleInput(session: CLISession, input: string) {
  const trimmedInput = input.trim().toLowerCase();
  
  // Global commands
  if (trimmedInput === 'help' || trimmedInput === '?') {
    sendToCLI(session, HELP_TEXT, true);
    return;
  }
  
  if (trimmedInput === 'menu') {
    session.currentMenu = 'main';
    showMenu(session);
    return;
  }
  
  if (trimmedInput === 'clear') {
    sendToCLI(session, '', true);
    showMenu(session);
    return;
  }
  
  if (trimmedInput === 'status') {
    await showStatus(session);
    return;
  }
  
  if (trimmedInput === 'reset') {
    sendToCLI(session, '\n⚠️  Resetting system... This will clear all data.');
    sendToCLI(session, 'Type "confirm" to proceed or "cancel" to abort.');
    session.mode = 'input';
    return;
  }
  
  if (trimmedInput === 'exit') {
    sendToCLI(session, '\n👋 Returning to web interface...');
    session.socket.emit('cli-exit');
    return;
  }
  
  // Handle menu selections
  if (session.mode === 'input') {
    await handleTextInput(session, trimmedInput);
    return;
  }
  
  // Menu mode - handle number selection
  const selection = parseInt(trimmedInput);
  if (!isNaN(selection) && selection >= 1 && selection <= 6) {
    await handleMenuSelection(session, selection);
  } else {
    sendToCLI(session, '\n❌ Invalid selection. Please enter a number (1-5 or 1-6).');
    sendToCLI(session, '> ');
  }
}

// Handle menu selection
async function handleMenuSelection(session: CLISession, selection: number) {
  switch (session.currentMenu) {
    case 'main':
      await handleMainMenu(session, selection);
      break;
    case 'configure':
      await handleConfigureMenu(session, selection);
      break;
    case 'search':
      await handleSearchMenu(session, selection);
      break;
    case 'build':
      await handleBuildMenu(session, selection);
      break;
    case 'agi':
      await handleAGIMenu(session, selection);
      break;
  }
}

// Main menu handlers
async function handleMainMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      await createProject(session);
      break;
    case 2:
      session.currentMenu = 'search';
      showMenu(session);
      break;
    case 3:
      session.currentMenu = 'configure';
      showMenu(session);
      break;
    case 4:
      session.currentMenu = 'agi';
      showMenu(session);
      break;
    case 5:
      sendToCLI(session, HELP_TEXT, true);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-5.');
      sendToCLI(session, '> ');
  }
}

// Configure menu handlers
async function handleConfigureMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      sendToCLI(session, '\n👤 Current User Profile:');
      await fetchAndDisplayUser(session);
      break;
    case 2:
      sendToCLI(session, '\n🔑 API Keys:');
      await fetchAndDisplayKeys(session);
      break;
    case 3:
      sendToCLI(session, '\n📦 GitHub Repository:');
      await fetchAndDisplayRepo(session);
      break;
    case 4:
      sendToCLI(session, '\n🎨 Current Tech Stack:');
      await fetchAndDisplayStack(session);
      break;
    case 5:
      sendToCLI(session, '\n📊 Experience Level:');
      await fetchAndDisplayExperience(session);
      break;
    case 6:
      session.currentMenu = 'main';
      showMenu(session);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-6.');
      sendToCLI(session, '> ');
  }
}

// Search menu handlers
async function handleSearchMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      sendToCLI(session, '\n🌐 Searching for AGI concepts...');
      await searchAGIConcepts(session);
      break;
    case 2:
      sendToCLI(session, '\n📚 Enter search query:');
      session.mode = 'input';
      session.projectData = { action: 'search-github' };
      break;
    case 3:
      sendToCLI(session, '\n🔗 Your repositories:');
      await fetchUserRepos(session);
      break;
    case 4:
      sendToCLI(session, '\n📋 Found Repositories:');
      await displayFoundRepos(session);
      break;
    case 5:
      session.currentMenu = 'main';
      showMenu(session);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-5.');
      sendToCLI(session, '> ');
  }
}

// Build menu handlers
async function handleBuildMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      sendToCLI(session, '\n📋 Build Instructions:');
      await displayBuildInstructions(session);
      break;
    case 2:
      sendToCLI(session, '\n▶️  Starting build process...');
      await startBuild(session);
      break;
    case 3:
      sendToCLI(session, '\n📊 Project Status:');
      await displayProjectStatus(session);
      break;
    case 4:
      sendToCLI(session, '\n📝 Uploaded Files:');
      await displayUploadedFiles(session);
      break;
    case 5:
      sendToCLI(session, '\n⚠️  Resetting project...');
      await resetProject(session);
      break;
    case 6:
      session.currentMenu = 'main';
      showMenu(session);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-6.');
      sendToCLI(session, '> ');
  }
}

// AGI menu handlers
async function handleAGIMenu(session: CLISession, selection: number) {
  switch (selection) {
    case 1:
      sendToCLI(session, '\n🔍 Searching for AGI-related repositories...');
      await searchAGIRepos(session);
      break;
    case 2:
      sendToCLI(session, '\n📦 Aggregating selected repositories...');
      await aggregateRepos(session);
      break;
    case 3:
      sendToCLI(session, '\n🚀 Generating AGI build instructions...');
      await generateAGIBuild(session);
      break;
    case 4:
      session.currentMenu = 'main';
      showMenu(session);
      break;
    default:
      sendToCLI(session, '\n❌ Invalid option. Please enter 1-4.');
      sendToCLI(session, '> ');
  }
}

// Handle text input
async function handleTextInput(session: CLISession, input: string) {
  if (input === 'confirm') {
    await performReset(session);
  } else if (input === 'cancel') {
    session.mode = 'menu';
    showMenu(session);
  } else if (session.projectData?.action === 'search-github') {
    await searchGitHubRepos(session, input);
  } else if (session.projectData?.action === 'project-name') {
    session.projectData.name = input;
    sendToCLI(session, '\nDescribe your project:');
    session.projectData.action = 'project-description';
  } else if (session.projectData?.action === 'project-description') {
    session.projectData.description = input;
    sendToCLI(session, '\n📂 Enter tech stack (comma separated, or press Enter to skip):');
    session.projectData.action = 'project-stack';
  } else if (session.projectData?.action === 'project-stack') {
    session.projectData.techStack = input;
    await submitProject(session);
  }
}

// Create project workflow
async function createProject(session: CLISession) {
  sendToCLI(session, '\n\n╔════════════════════════════════════════════════════════════╗');
  sendToCLI(session, '║                    CREATE NEW PROJECT                          ║');
  sendToCLI(session, '╠══════════════════════════════════════════════════════════╣\n');
  
  sendToCLI(session, 'Select project type:');
  PROJECT_TYPES.forEach((type, index) => {
    sendToCLI(session, `  [${index + 1}] ${type.emoji} ${type.name}`);
  });
  sendToCLI(session, '  [7] 🔧 Custom Project\n');
  sendToCLI(session, '> ');
  
  session.mode = 'input';
  session.projectData = { action: 'project-type' };
}

// API calls to backend
async function fetchAndDisplayUser(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/onboarding/status');
    const data = await response.json();
    
    if (data.user) {
      sendToCLI(session, `  Name: ${data.user.name}`);
      sendToCLI(session, `  Email: ${data.user.email}`);
      sendToCLI(session, `  GitHub: ${data.user.githubUsername}`);
      sendToCLI(session, `  Experience: ${data.user.experienceLevel}`);
    } else {
      sendToCLI(session, '  ⚠️ No user profile found. Complete onboarding first.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch user profile.');
  }
  sendToCLI(session, '\n> ');
}

async function fetchAndDisplayKeys(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/evolution/config');
    const data = await response.json();
    
    sendToCLI(session, `  GitHub Token: ${data.githubToken ? '✓ Configured' : '✗ Not configured'}`);
    sendToCLI(session, `  Gemini API Key: ${data.geminiApiKey ? '✓ Configured' : '✗ Not configured'}`);
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch API keys.');
  }
  sendToCLI(session, '\n> ');
}

async function fetchAndDisplayRepo(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/evolution/config');
    const data = await response.json();
    
    if (data.githubRepo) {
      sendToCLI(session, `  Repository: ${data.githubRepo}`);
    } else {
      sendToCLI(session, '  ⚠️ No repository configured.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch repository info.');
  }
  sendToCLI(session, '\n> ');
}

async function fetchAndDisplayStack(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/onboarding/status');
    const data = await response.json();
    
    if (data.user) {
      const userResponse = await fetch(`http://localhost:3000/api/user/${data.user.id}`);
      const userData = await userResponse.json();
      
      if (userData.techStack) {
        const stack = JSON.parse(userData.techStack);
        sendToCLI(session, `  Technologies: ${stack.join(', ')}`);
      } else {
        sendToCLI(session, '  No tech stack configured.');
      }
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch tech stack.');
  }
  sendToCLI(session, '\n> ');
}

async function fetchAndDisplayExperience(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/onboarding/status');
    const data = await response.json();
    
    if (data.user) {
      sendToCLI(session, `  Level: ${data.user.experienceLevel}`);
    } else {
      sendToCLI(session, '  ⚠️ No user profile found.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch experience level.');
  }
  sendToCLI(session, '\n> ');
}

async function showStatus(session: CLISession) {
  sendToCLI(session, '\n╔════════════════════════════════════════════════════════════╗');
  sendToCLI(session, '║                    SYSTEM STATUS                             ║');
  sendToCLI(session, '╠══════════════════════════════════════════════════════════╣\n');
  
  try {
    const [userResponse, configResponse] = await Promise.all([
      fetch('http://localhost:3000/api/onboarding/status'),
      fetch('http://localhost:3000/api/evolution/config')
    ]);
    
    const userData = await userResponse.json();
    const configData = await configResponse.json();
    
    sendToCLI(session, '👤 User:');
    sendToCLI(session, `   Status: ${userData.onboardingCompleted ? '✓ Onboarded' : '✗ Not onboarded'}`);
    if (userData.user) {
      sendToCLI(session, `   Name: ${userData.user.name}`);
      sendToCLI(session, `   GitHub: ${userData.user.githubUsername}`);
    }
    
    sendToCLI(session, '\n🔑 Configuration:');
    sendToCLI(session, `   GitHub Token: ${configData.githubToken ? '✓' : '✗'}`);
    sendToCLI(session, `   Gemini API: ${configData.geminiApiKey ? '✓' : '✗'}`);
    sendToCLI(session, `   Repository: ${configData.githubRepo || 'Not set'}`);
    sendToCLI(session, `   Evolution Cycle: ${configData.evolutionCycle || 1}`);
    
  } catch (error) {
    sendToCLI(session, '❌ Failed to fetch system status.');
  }
  
  sendToCLI(session, '\n> ');
}

async function searchAGIConcepts(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/search/agi-concepts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'AGI artificial general intelligence concepts architecture' })
    });
    
    const data = await response.json();
    
    if (data.results) {
      sendToCLI(session, `\n✓ Found ${data.results.length} concepts:\n`);
      data.results.slice(0, 10).forEach((result: any, index: number) => {
        sendToCLI(session, `  [${index + 1}] ${result.title}`);
        sendToCLI(session, `      ${result.snippet}`);
      });
    } else {
      sendToCLI(session, '  No results found.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Search failed.');
  }
  sendToCLI(session, '\n> ');
}

async function searchGitHubRepos(session: CLISession, query: string) {
  try {
    const response = await fetch('http://localhost:3000/api/github/search-repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, projectType: 'custom', techStack: [] })
    });
    
    const data = await response.json();
    
    if (data.repos) {
      sendToCLI(session, `\n✓ Found ${data.repos.length} repositories:\n`);
      data.repos.slice(0, 10).forEach((repo: any, index: number) => {
        sendToCLI(session, `  [${index + 1}] ${repo.owner}/${repo.repoName}`);
        sendToCLI(session, `      ${repo.description || 'No description'}`);
        sendToCLI(session, `      ⭐ ${repo.stars} stars | 📌 ${(repo.relevanceScore * 100).toFixed(0)}% match`);
      });
      session.mode = 'menu';
    } else {
      sendToCLI(session, '  No repositories found.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Search failed.');
  }
  sendToCLI(session, '\n> ');
}

async function searchAGIRepos(session: CLISession) {
  sendToCLI(session, '  Searching quantum computing, AI consciousness, AGI research repos...');
  await searchGitHubRepos(session, 'artificial general intelligence AGI consciousness quantum');
}

async function aggregateRepos(session: CLISession) {
  sendToCLI(session, '  Select repositories to aggregate (comma-separated numbers):');
  sendToCLI(session, '  Type "all" to aggregate all found repositories.');
  session.mode = 'input';
  session.projectData = { action: 'aggregate-select' };
}

async function generateAGIBuild(session: CLISession) {
  sendToCLI(session, '  Generating AGI build instructions...');
  sendToCLI(session, '  This may take several minutes...\n');
  
  // Call backend to generate
  try {
    const response = await fetch('http://localhost:3000/api/generate-agi-build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.instructions) {
      sendToCLI(session, '  ✓ Build instructions generated successfully!');
      sendToCLI(session, `  Instructions saved to: ${data.projectId}\n`);
    } else {
      sendToCLI(session, '  ❌ Failed to generate instructions.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Generation failed.');
  }
  
  session.mode = 'menu';
  sendToCLI(session, '> ');
}

async function submitProject(session: CLISession) {
  sendToCLI(session, '\n📂 Uploading files? (Y/N, or press Enter to skip):');
  session.mode = 'input';
  session.projectData.action = 'upload-files';
}

async function displayFoundRepos(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/repos/found');
    const data = await response.json();
    
    if (data.repos && data.repos.length > 0) {
      sendToCLI(session, `\nFound ${data.repos.length} repositories:\n`);
      data.repos.forEach((repo: any, index: number) => {
        sendToCLI(session, `  [${index + 1}] ${repo.repoName}`);
        sendToCLI(session, `      ${repo.repoUrl}`);
        sendToCLI(session, `      Relevance: ${(repo.relevanceScore * 100).toFixed(0)}%`);
      });
    } else {
      sendToCLI(session, '  No repositories found yet. Use Search menu first.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch repositories.');
  }
  sendToCLI(session, '\n> ');
}

async function displayBuildInstructions(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/instructions/latest');
    const data = await response.json();
    
    if (data.instructions) {
      sendToCLI(session, '\n' + '='.repeat(60));
      sendToCLI(session, 'BUILD INSTRUCTIONS');
      sendToCLI(session, '='.repeat(60) + '\n');
      sendToCLI(session, data.instructions);
      sendToCLI(session, '\n' + '='.repeat(60) + '\n');
    } else {
      sendToCLI(session, '  No build instructions generated yet.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch instructions.');
  }
  sendToCLI(session, '\n> ');
}

async function startBuild(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/project/start-build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success) {
      sendToCLI(session, '  ✓ Build started successfully!');
      sendToCLI(session, '  Check web interface for progress.\n');
    } else {
      sendToCLI(session, '  ❌ Failed to start build.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Build failed.');
  }
  sendToCLI(session, '\n> ');
}

async function displayProjectStatus(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/project/status');
    const data = await response.json();
    
    sendToCLI(session, `\nProject: ${data.projectType || 'Not set'}`);
    sendToCLI(session, `Status: ${data.status || 'Unknown'}`);
    sendToCLI(session, `Files uploaded: ${data.filesUploaded || 0}`);
    sendToCLI(session, `Repos found: ${data.reposFound || 0}\n`);
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch project status.');
  }
  sendToCLI(session, '\n> ');
}

async function displayUploadedFiles(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/files/uploaded');
    const data = await response.json();
    
    if (data.files && data.files.length > 0) {
      sendToCLI(session, `\nUploaded ${data.files.length} files:\n`);
      data.files.forEach((file: any, index: number) => {
        sendToCLI(session, `  [${index + 1}] ${file.fileName}`);
        sendToCLI(session, `      Type: ${file.fileType}`);
        sendToCLI(session, `      Size: ${(file.fileSize / 1024).toFixed(2)} KB`);
      });
    } else {
      sendToCLI(session, '  No files uploaded yet.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch files.');
  }
  sendToCLI(session, '\n> ');
}

async function resetProject(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/project/reset', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      sendToCLI(session, '  ✓ Project reset successfully!\n');
      session.mode = 'menu';
      showMenu(session);
    } else {
      sendToCLI(session, '  ❌ Failed to reset project.');
      sendToCLI(session, '\n> ');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Reset failed.');
    sendToCLI(session, '\n> ');
  }
}

async function fetchUserRepos(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/user/repos');
    const data = await response.json();
    
    if (data.repos && data.repos.length > 0) {
      sendToCLI(session, `\nYour repositories (${data.repos.length}):\n`);
      data.repos.forEach((repo: any, index: number) => {
        sendToCLI(session, `  [${index + 1}] ${repo.name}`);
        sendToCLI(session, `      ${repo.url || repo.full_name}`);
        sendToCLI(session, `      Updated: ${new Date(repo.updated_at).toLocaleDateString()}`);
      });
    } else {
      sendToCLI(session, '  No repositories found.');
    }
  } catch (error) {
    sendToCLI(session, '  ❌ Failed to fetch repositories.');
  }
  sendToCLI(session, '\n> ');
}

async function performReset(session: CLISession) {
  try {
    const response = await fetch('http://localhost:3000/api/system/reset', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      sendToCLI(session, '\n✓ System reset successfully!');
      sendToCLI(session, 'Please complete onboarding again.\n');
      showMenu(session);
    } else {
      sendToCLI(session, '\n❌ Failed to reset system.');
    }
  } catch (error) {
    sendToCLI(session, '\n❌ Reset failed.');
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`CLI client connected: ${socket.id}`);
  
  const session = createSession(socket);
  sessions.set(socket.id, session);
  
  // Show welcome screen
  sendToCLI(session, `
╔════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗██╗   ██╗ ███████╗███████╗██████╗ █████╗ ██╗     ██╗    ║
║     ██╔════╝██║   ██║██╔════╝██╔════╝██╔══██╗██║     ██║    ║
║     ███████╗██║   ██║███████╗███████╗█████╔╝║██║ █╗ ██║    ║
║     ╚════██║╚██ ██╔╝╚════██║██╔══██║██╔══██╗██║███╗██║    ║
║     ███████║ ╚████╔╝ ███████║╚██████╔╝╚██████╔╝╚███╔██╔╝    ║
║                                                               ║
║              EVOLUTION ENGINE - DOS STYLE CLI                  ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Type "help" or "?" for available commands                        ║
║  Type menu options to navigate                                       ║
║  Type "exit" to return to web interface                     ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝
  `, true);
  
  setTimeout(() => {
    showMenu(session);
  }, 1000);
  
  // Handle input
  socket.on('cli-input', (data) => {
    handleInput(session, data.input);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`CLI client disconnected: ${socket.id}`);
    sessions.delete(socket.id);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                                                               ║`);
  console.log(`║   CLI Service Started on port ${PORT}                             ║`);
  console.log(`║                                                               ║`);
  console.log(`║   Access from web UI or connect directly to port ${PORT}        ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
});
