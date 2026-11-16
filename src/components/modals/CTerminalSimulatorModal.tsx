import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Terminal,
  Download,
  Copy,
  Check,
  FileCode,
  Play,
  RotateCcw,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { C_PROJECT_SOURCES, downloadCProjectZip } from '../../utils/zipExporter';
import { Consumer, WaterRecord, Bill, Payment, TariffConfig } from '../../types';

interface CTerminalSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumers: Consumer[];
  records: WaterRecord[];
  bills: Bill[];
  payments: Payment[];
  tariff: TariffConfig;
}

export const CTerminalSimulatorModal: React.FC<CTerminalSimulatorModalProps> = ({
  isOpen,
  onClose,
  consumers,
  records,
  bills,
  payments,
  tariff,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'terminal' | 'source' | 'docs'>('terminal');
  const [selectedFile, setSelectedFile] = useState<string>('main.c');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '****************************************************************',
    '*   WELCOME TO SMART WATER MONITORING & BILLING SIMULATOR      *',
    '*   Developed in C11 for Academic Simulation & Municipal Tech  *',
    '****************************************************************',
    '',
    '==============================================',
    '       SMART WATER MANAGEMENT SYSTEM          ',
    '==============================================',
    ' 1. Register New Consumer',
    ' 2. View Consumer Details',
    ' 3. Monitor Water Consumption',
    ' 4. Calculate Water Bill (Tariff Simulator)',
    ' 5. Generate Monthly Bill',
    ' 6. View Consumption Analytics',
    ' 7. Check Leakage / Excess Usage Alerts',
    ' 8. Manage Payments',
    ' 9. View Billing History',
    ' 10. Exit',
    '==============================================',
    'Enter your choice (1-10): ',
  ]);
  const [inputVal, setInputVal] = useState('');
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleCopyCode = () => {
    const code = C_PROJECT_SOURCES[selectedFile] || '';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadCProjectZip();
    } finally {
      setIsZipping(false);
    }
  };

  // Virtual C Execution dispatcher
  const executeCCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const newLines = [`> ${cmd}`];

    switch (trimmed) {
      case '1':
        newLines.push(
          '',
          '==================================================',
          '         MODULE 1: REGISTER NEW CONSUMER',
          '==================================================',
          `Generated Consumer ID : CON${100 + consumers.length + 1}`,
          'Enter Household / Consumer Name: [Simulated CLI Input]',
          'Enter Household Address        : [Simulated CLI Input]',
          'Enter 10-Digit Contact Phone   : 9876543210',
          '',
          '[SUCCESS] Consumer registered successfully into data/consumers.txt!'
        );
        break;

      case '2':
        newLines.push(
          '',
          '+----------+----------------------+-----------------------------+-----------------+',
          '| ID       | Full Name            | Address                     | Phone           |',
          '+----------+----------------------+-----------------------------+-----------------+'
        );
        consumers.forEach((c) => {
          newLines.push(
            `| ${c.consumerID.padEnd(8)} | ${c.name.slice(0, 20).padEnd(20)} | ${c.address.slice(0, 27).padEnd(27)} | ${c.phoneNumber.padEnd(15)} |`
          );
        });
        newLines.push(
          '+----------+----------------------+-----------------------------+-----------------+',
          `Total registered consumers: ${consumers.length}`
        );
        break;

      case '3':
        newLines.push(
          '',
          '==================================================',
          '   MODULE 2: WATER CONSUMPTION MONITORING',
          '==================================================',
          'Consumer Selected: CON101 (Ravindra Sharma)',
          'Billing Cycle    : June, 2024',
          'Previous Reading : 216.00 KL',
          'Current Reading  : 254.00 KL',
          '--------------------------------------------------',
          'Calculated Net Consumption: 38.00 KL  (38,000 Litres)',
          '[ALERT] High consumption detected (38.00 KL > 30 KL threshold).',
          '[SUCCESS] Meter reading appended to data/water_records.txt'
        );
        break;

      case '4':
        newLines.push(
          '',
          '==================================================',
          '    MODULE 3: WATER BILL TARIFF CALCULATOR',
          '==================================================',
          `Tariff Model: Progressive Slabs (C11 Algorithm)`,
          `  0  - 10 KL : Rs. ${tariff.slab1Rate.toFixed(2)}/KL`,
          `  11 - 20 KL : Rs. ${tariff.slab2Rate.toFixed(2)}/KL`,
          `  21 - 30 KL : Rs. ${tariff.slab3Rate.toFixed(2)}/KL`,
          `  Above 30 KL: Rs. ${tariff.slab4Rate.toFixed(2)}/KL`,
          `  Fixed Fee  : Rs. ${tariff.fixedServiceCharge.toFixed(2)}`,
          '--------------------------------------------------',
          'Simulated Test Run for 25.00 KL:',
          '  Slab 1 (10 KL @ 5.0)  : Rs.  50.00',
          '  Slab 2 (10 KL @ 8.0)  : Rs.  80.00',
          '  Slab 3 ( 5 KL @ 12.0) : Rs.  60.00',
          '  Slab 4 ( 0 KL @ 15.0) : Rs.   0.00',
          '  Base Water Charges    : Rs. 190.00',
          '  Fixed Service Charge  : Rs.  50.00',
          '  TOTAL AMOUNT PAYABLE  : Rs. 240.00'
        );
        break;

      case '5':
        newLines.push(
          '',
          '======================================================================',
          '                 AQUA SMART WATER BILLING INVOICE                     ',
          '======================================================================',
          ' Bill Number     : BIL502               Bill Date   : 2024-06-30',
          ' Consumer ID     : CON101               Status      : [UNPAID]',
          ' Consumer Name   : Ravindra Sharma      Phone       : 9876543210',
          ' Address         : Plot 42, Green Meadows Sector 4',
          ' Billing Cycle   : June 2024',
          '----------------------------------------------------------------------',
          ' METER READING SUMMARY:',
          '   Previous Reading      :     216.00 KL',
          '   Current Reading       :     254.00 KL',
          '   Total Billed Volume   :      38.00 KL  (38000 Litres)',
          '----------------------------------------------------------------------',
          ' PROGRESSIVE SLAB BILLING BREAKDOWN:',
          '   Slab 1 (0  - 10 KL) @ Rs.  5.00/KL :  10.00 KL  =>  Rs.    50.00',
          '   Slab 2 (11 - 20 KL) @ Rs.  8.00/KL :  10.00 KL  =>  Rs.    80.00',
          '   Slab 3 (21 - 30 KL) @ Rs. 12.00/KL :  10.00 KL  =>  Rs.   120.00',
          '   Slab 4 (>  30 KL  ) @ Rs. 15.00/KL :   8.00 KL  =>  Rs.   120.00',
          '----------------------------------------------------------------------',
          '   Base Water Charges                 : Rs.       370.00',
          '   Fixed Service Charge               : Rs.        50.00',
          '======================================================================',
          '   TOTAL PAYABLE AMOUNT               : Rs.       420.00',
          '======================================================================',
          ' [!] NOTICE: Consumption exceeded 30 KL. Excess usage tariff applied.',
          '======================================================================'
        );
        break;

      case '6':
        newLines.push(
          '',
          '==================================================',
          '       MODULE 5: WATER USAGE ANALYTICS',
          '==================================================',
          'Analyzing consumer records...',
          '+-------------------------------------------------------------+',
          '|                CONSUMPTION ANALYTICS SUMMARY                |',
          '+-------------------------------------------------------------+',
          `  Total Records Analyzed     : 10                             |`,
          `  Total Water Consumed       : 232.00 KL  (    232000 L)      |`,
          `  Average Monthly Usage      : 23.20 KL   (     23200 L)      |`,
          `  Peak Consumption Month     : June (42.00 KL)                |`,
          `  Latest vs Prior Delta      : +13.00 KL (+52.0%)             |`,
          '+-------------------------------------------------------------+',
          '',
          '--- WATER USAGE ASCII BAR CHART (KL) ---',
          'Jan        | #################### 18.00 KL (18000 L)',
          'Feb        | ####################### 21.00 KL (21000 L)',
          'Mar        | ########################## 24.00 KL (24000 L)',
          'Apr        | ############################### 28.00 KL (28000 L)',
          'May        | ############################ 25.00 KL (25000 L)',
          'June       | ########################################## 38.00 KL (38000 L)',
          '           +---------------------------------------->',
          "Scale: '#' represents proportional volume up to 42.0 KL"
        );
        break;

      case '7':
        newLines.push(
          '',
          '==================================================',
          ' MODULE 6: WATER LEAKAGE & EXCESS USAGE ALERTS',
          '==================================================',
          '[SIMULATION NOTICE] Alerts generated via heuristic delta analysis.',
          '',
          '+------------+-----------+------+------------+---------------+---------------------------------+',
          '| ConsumerID | Month     | Year | Usage (KL) | Excess (KL)   | Alert Diagnosis                 |',
          '+------------+-----------+------+------------+---------------+---------------------------------+',
          '| CON101     | June      | 2024 |      38.00 |          8.00 | WARNING: Abnormal consumption   |',
          '| CON103     | June      | 2024 |      42.00 |         12.00 | CRITICAL: Continuous pipe leak  |',
          '+------------+-----------+------+------------+---------------+---------------------------------+',
          '',
          '--- CONSERVATION MEASURES ---',
          '1. Inspect toilet cistern flapper seal for silent seepage.',
          '2. Replace dripping sink faucet washers (saves up to 15L/day).',
          '3. Install low-flow faucet aerator nozzles (saves 30-50%).'
        );
        break;

      case '8':
        newLines.push(
          '',
          '==================================================',
          '         MODULE 7: PAYMENT MANAGEMENT',
          '==================================================',
          'Pending Bills for Settlement:',
          '  BIL502 | CON101 | June 2024 | Rs. 420.00 | Status: UNPAID',
          '  BIL504 | CON103 | June 2024 | Rs. 480.00 | Status: UNPAID',
          'Processing settlement for BIL502 via simulated UPI Smart Pay...',
          '[SUCCESS] Payment receipt RCP-982144 logged in data/payments.txt.',
          'Bill status updated to [PAID].'
        );
        break;

      case '9':
        newLines.push(
          '',
          '+----------+------------+-----------+------+------------+-------------+------------+----------+',
          '| BillID   | ConsumerID | Month     | Year | Usage (KL) | Base (Rs.)  | Total(Rs.) | Status   |',
          '+----------+------------+-----------+------+------------+-------------+------------+----------+',
          '| BIL501   | CON101     | May       | 2024 |      25.00 |      190.00 |     240.00 | PAID     |',
          '| BIL502   | CON101     | June      | 2024 |      38.00 |      370.00 |     420.00 | UNPAID   |',
          '| BIL503   | CON102     | June      | 2024 |      18.00 |      114.00 |     164.00 | PAID     |',
          '| BIL504   | CON103     | June      | 2024 |      42.00 |      430.00 |     480.00 | UNPAID   |',
          '+----------+------------+-----------+------+------------+-------------+------------+----------+'
        );
        break;

      case '10':
        newLines.push(
          '',
          'Thank you for using Smart Water Management System! Conserve Water. Goodbye.'
        );
        break;

      case 'help':
      case 'menu':
        newLines.push(
          '==============================================',
          '       SMART WATER MANAGEMENT SYSTEM          ',
          '==============================================',
          ' 1. Register New Consumer',
          ' 2. View Consumer Details',
          ' 3. Monitor Water Consumption',
          ' 4. Calculate Water Bill (Tariff Simulator)',
          ' 5. Generate Monthly Bill',
          ' 6. View Consumption Analytics',
          ' 7. Check Leakage / Excess Usage Alerts',
          ' 8. Manage Payments',
          ' 9. View Billing History',
          ' 10. Exit',
          '=============================================='
        );
        break;

      case 'clear':
      case 'cls':
        setTerminalHistory(['Terminal cleared. Type 1 to 10 for C menu options, or "menu" to view options:']);
        return;

      default:
        newLines.push(`[!] Invalid choice "${trimmed}". Please enter a number between 1 and 10.`);
        break;
    }

    newLines.push('', 'Enter your choice (1-10): ');
    setTerminalHistory((prev) => [...prev, ...newLines]);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    executeCCommand(inputVal);
    setInputVal('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-3xl max-w-5xl w-full h-[88vh] shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  SmartWaterBilling C Studio &amp; Console Simulator
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold uppercase">
                  C11 Standard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                100% GCC &amp; Windows compatible console simulator, source code hub &amp; ZIP exporter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Download Complete C ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Bundling ZIP...' : 'Download C Project (.zip)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Tabs */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'terminal'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Live Interactive Console</span>
            </button>
            <button
              onClick={() => setActiveTab('source')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'source'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Source Files Explorer (14 files)</span>
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'docs'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Academic README &amp; GCC Guide</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            GCC / VS Code / Code::Blocks / Dev-C++
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'terminal' && (
            <div className="flex-1 flex flex-col bg-black text-emerald-400 font-mono text-xs p-4 overflow-hidden">
              {/* Quick Choice Buttons for Ease of Use */}
              <div className="flex items-center gap-1.5 pb-3 border-b border-slate-800 overflow-x-auto text-[11px]">
                <span className="text-slate-500 font-sans font-bold uppercase text-[10px] mr-1">
                  Quick Actions:
                </span>
                {[
                  { label: '1. Register', val: '1' },
                  { label: '2. View Consumers', val: '2' },
                  { label: '3. Meter Reading', val: '3' },
                  { label: '4. Tariff Calc', val: '4' },
                  { label: '5. Gen Bill', val: '5' },
                  { label: '6. Analytics & Bar', val: '6' },
                  { label: '7. Leak Alert', val: '7' },
                  { label: '8. Settle Pay', val: '8' },
                  { label: '9. Bill History', val: '9' },
                  { label: 'Clear', val: 'clear' },
                ].map((btn) => (
                  <button
                    key={btn.val}
                    onClick={() => executeCCommand(btn.val)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-sky-300 rounded border border-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Terminal Logs Output */}
              <div className="flex-1 overflow-y-auto pt-3 space-y-0.5 leading-relaxed selection:bg-sky-500 selection:text-black">
                {terminalHistory.map((line, idx) => (
                  <div
                    key={idx}
                    className={
                      line.startsWith('>')
                        ? 'text-sky-300 font-bold'
                        : line.includes('[ALERT]') || line.includes('[WARNING]')
                        ? 'text-amber-400 font-bold'
                        : line.includes('[SUCCESS]')
                        ? 'text-emerald-300 font-bold'
                        : line.includes('===') || line.includes('***') || line.includes('---')
                        ? 'text-slate-500'
                        : 'text-slate-300'
                    }
                  >
                    {line || '\u00A0'}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              {/* Command Input Field */}
              <form onSubmit={handleInputSubmit} className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <span className="text-sky-400 font-bold font-mono">$</span>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Enter menu choice (1-10) or command..."
                  className="flex-1 bg-transparent border-none text-emerald-300 font-mono text-xs focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded border border-emerald-500/40 font-bold text-[11px] cursor-pointer"
                >
                  Enter
                </button>
              </form>
            </div>
          )}

          {activeTab === 'source' && (
            <div className="flex-1 flex overflow-hidden">
              {/* File Tree Left Column */}
              <div className="w-56 bg-slate-950 border-r border-slate-800 p-3 overflow-y-auto space-y-1 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 tracking-wider">
                  Source Modules (.c / .h)
                </div>
                {Object.keys(C_PROJECT_SOURCES).map((file) => (
                  <button
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-mono text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      selectedFile === file
                        ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span className="truncate">{file}</span>
                    <span className="text-[10px] text-slate-600 uppercase">
                      {file.endsWith('.h') ? 'HDR' : file.endsWith('.c') ? 'SRC' : 'DAT'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Code Viewer Right Column */}
              <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-xs">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-sky-400" />
                    <span className="font-mono text-white font-bold">{selectedFile}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy File Content'}</span>
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#0a0f1d]">
                  <pre>{C_PROJECT_SOURCES[selectedFile] || '// File empty'}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950 text-slate-300 text-xs space-y-4 leading-relaxed font-sans">
              <div className="p-4 bg-sky-950/40 border border-sky-800/50 rounded-2xl">
                <h4 className="text-base font-bold text-sky-300 mb-2">
                  Academic Project Architecture &amp; C11 Standards
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  This application strictly implements the 7 core modules in modular standard C (C11 standard) with
                  custom data persistence in <code className="font-mono text-sky-400">data/*.txt</code>.
                  Zero external non-standard dependencies or third-party frameworks are used.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <h5 className="font-bold text-white mb-2 text-sm">Compilation with GCC (Windows / MinGW)</h5>
                  <div className="bg-black p-3 rounded-xl font-mono text-[11px] text-emerald-400">
                    gcc -Wall -Wextra -std=c11 main.c consumer.c monitoring.c billing.c analytics.c payment.c file_manager.c -o smart_water_billing.exe
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <h5 className="font-bold text-white mb-2 text-sm">Compilation with GCC (Linux / macOS)</h5>
                  <div className="bg-black p-3 rounded-xl font-mono text-[11px] text-emerald-400">
                    gcc -Wall -Wextra -std=c11 main.c consumer.c monitoring.c billing.c analytics.c payment.c file_manager.c -o smart_water_billing<br />
                    ./smart_water_billing
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                <h5 className="font-bold text-white mb-2 text-sm">Progressive Slab Tariff Model</h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Slab 1 (0 – 10 KL):</strong> ₹5.00 per KL</li>
                  <li><strong>Slab 2 (11 – 20 KL):</strong> ₹8.00 per KL</li>
                  <li><strong>Slab 3 (21 – 30 KL):</strong> ₹12.00 per KL</li>
                  <li><strong>Slab 4 (Above 30 KL):</strong> ₹15.00 per KL</li>
                  <li><strong>Fixed Service Charge:</strong> ₹50.00 added to all active cycles</li>
                  <li><strong>Leakage Anomaly Detection:</strong> Threshold at 30.0 KL</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
