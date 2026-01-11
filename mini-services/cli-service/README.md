# Evolution Engine CLI Service

A DOS-style command line interface for Evolution Engine with full AGI creation capabilities.

## Starting the CLI Service

```bash
cd mini-services/cli-service
bun install
bun run dev
```

The CLI service runs on **port 3001**.

## Accessing the CLI

### From Web Interface
Navigate to: `http://localhost:3000/cli`

This provides a terminal-style interface connected to the CLI service via WebSocket.

### Direct Connection
The CLI service exposes a Socket.IO server on port 3001. You can connect any Socket.IO client to this port.

## Available Commands

### Global Commands (available from any menu)
```
help, ?          Show comprehensive help screen
menu             Return to main menu
clear            Clear the screen
status            Show current system status
reset            Reset entire system (requires confirmation)
exit              Exit CLI and return to web UI
```

### Navigation
```
1-5              Select main menu option by number
1-6              Select submenu option by number
ESC               Return to previous menu
↑/↓              Navigate command history
Enter              Submit command or selection
```

## Menu Structure

### Main Menu
1. **Create New Project** - Start a new project with type selection
2. **Search AGI Concepts/Repos** - Search for AGI concepts and GitHub repositories
3. **Configure Settings** - View and modify system configuration
4. **Create AGI System** - Aggregate repos to create AGI
5. **Help** - Show all available options

### Configure Menu
1. User Profile Information
2. API Keys (GitHub, Gemini)
3. GitHub Repository Settings
4. Technology Stack Preferences
5. Experience Level
6. Back to Main Menu

### Search Menu
1. **Search AGI Concepts** - Google search for AGI concepts
2. **Search GitHub Repositories** - Search GitHub with custom query
3. **Search Your Repositories** - List your GitHub repositories
4. **View Found Repositories** - Show previously found repositories
5. **Back to Main Menu**

### Build Menu
1. View Build Instructions
2. Start Building Project
3. View Project Status
4. View Uploaded Files
5. Reset Project
6. **Back to Main Menu**

### Create AGI Menu
1. **Find AGI-Related Repositories** - Auto-search for AGI repos
2. **Aggregate Selected Repositories** - Combine multiple repos
3. **Generate AGI Build Instructions** - Create comprehensive AGI guide
4. **Back to Main Menu**

## AGI Creation Workflow

1. From Main Menu, select **[4] Create AGI System**
2. Choose **[1] Find AGI-Related Repositories**
   - Automatically searches for AGI, consciousness, reasoning, memory repos
   - Finds quantum computing and AI architecture repositories
3. Select **[2] Aggregate Selected Repositories**
   - Choose which repositories to include
   - System combines code and documentation
4. Select **[3] Generate AGI Build Instructions**
   - AI creates comprehensive build guide
   - Includes all AGI modules:
     * Consciousness Layer
     * Reasoning Engine
     * Memory System
     * Learning Module
     * Security & Safety
     * Multi-Agent Coordination
5. Instructions are saved to your GitHub repository

## Project Creation Workflow

1. Select **[1] Create New Project** from Main Menu
2. Choose project type:
   - [1] Quantum Operating System
   - [2] Book Writer Assistant
   - [3] AI Chatbot System
   - [4] E-commerce Platform
   - [5] Analytics Dashboard
   - [6] Custom Project
3. Enter project name
4. Describe your project
5. Specify tech stack (optional)
6. Upload files (.bin, .pdf, .json, .zip, etc.)
7. System searches GitHub for relevant repositories
8. AI generates build instructions
9. Start building project

## System Features

### GitHub Integration
- Search repositories by query or topic
- Calculate relevance scores
- Aggregate multiple repositories into one system
- Commit build instructions to your repo

### AI-Powered Search
- AGI concepts search using LLM
- Intelligent repository matching
- Automatic tech stack suggestion
- Build instruction generation

### AGI System Building
- Combines best practices from multiple repos
- Comprehensive architecture guidance
- Step-by-step implementation
- Code examples for each module
- Safety and alignment considerations

## File Upload Support

Supports file types:
- **.bin** - Binary files
- **.pdf** - Documents
- **.json** - Configuration and data
- **.zip** - Archives
- **.ts/.js** - Source code
- **.py** - Python scripts
- **.yaml/.yml** - Configuration files

## Database Models

### ProjectSpecification
- Project type and description
- Requirements and tech stack
- Status tracking

### UploadedFile
- File metadata
- Project association

### RelevantRepo
- Repository information
- Relevance score (AI-calculated)
- Topic and language data

### BuildInstructions
- Generated instructions
- Phase tracking
- Completion status

## Troubleshooting

### CLI Service Not Starting
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill existing process
kill -9 <PID>
```

### WebSocket Connection Failed
1. Ensure CLI service is running on port 3001
2. Check firewall settings
3. Verify Caddyfile has correct port forwarding

### Commands Not Responding
1. Type `status` to check system health
2. Type `menu` to return to main menu
3. Type `clear` to reset screen
4. Type `exit` to return to web UI

## Integration with Web Interface

The CLI service integrates seamlessly with the web interface:
- All commands affect the same database
- Project status syncs automatically
- Build instructions available in web UI
- GitHub operations handled by backend

## Example Session

```
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

> 4

╔════════════════════════════════════════════════════════════╗
║                     CREATE AGI SYSTEM                              ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  Select an option (1-4):                                    ║
║                                                               ║
║  [1] 🔍 Find AGI-Related Repositories                         ║
║  [2] 📦 Aggregate Selected Repositories                        ║
║  [3] 🚀 Generate AGI Build Instructions                     ║
║  [4] 🔙 Back to Main Menu                                   ║
║                                                               ║
╚════════════════════════════════════════════════════════════╝

> 1

🔍 Searching for AGI-related repositories...
✓ Found 15 repositories

> 3

🚀 Generating AGI build instructions...
  ✓ Build instructions generated successfully!
  Instructions saved to your project
```

## Security Notes

- GitHub tokens are stored securely in database
- AGI safety and alignment are emphasized in build instructions
- System logs all operations
- Reset functionality requires confirmation

## Future Enhancements

- [ ] Multi-user CLI sessions
- [ ] Command aliases
- [ ] Script execution mode
- [ ] Real-time progress bars
- [ ] Export terminal sessions
