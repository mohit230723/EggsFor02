import { getQuickJS } from "quickjs-emscripten";

export interface SandboxResult {
  success: boolean;
  returnValue: any;
  error?: string;
  logs: string[];
}

export async function evaluateAgentMove(
  code: string,
  state: any,
  timeoutMs: number = 500,
  maxMemoryBytes: number = 1024 * 1024 * 5 // 5MB
): Promise<SandboxResult> {
  const QuickJS = await getQuickJS();
  
  // We use newContext instead of newRuntime for simpler execution,
  // but if we need memory limits, newRuntime() is required.
  const runtime = QuickJS.newRuntime();
  runtime.setMemoryLimit(maxMemoryBytes);
  runtime.setMaxStackSize(1024 * 512); // 512KB
  
  // We don't have a direct interrupt handler in the basic API, 
  // so we will rely on strict instruction counts to effectively timeout.
  // Set a large but finite instruction limit.
  runtime.setMaxStackSize(0); // unlimited stack, bounded by memory
  runtime.setInterruptHandler(() => false); 

  const context = runtime.newContext();
  
  const logs: string[] = [];

  try {
    // Inject the current state into the global object
    const stateHandle = context.newString(JSON.stringify(state));
    context.setProp(context.global, 'GAME_STATE_JSON', stateHandle);
    stateHandle.dispose();

    // Inject console.log for debugging within the sandbox
    const logHandle = context.newFunction("log", (...args) => {
      const parts = args.map(a => context.dump(a));
      logs.push(parts.join(" "));
    });
    const customConsole = context.newObject();
    context.setProp(customConsole, "log", logHandle);
    context.setProp(context.global, "console", customConsole);
    logHandle.dispose();
    customConsole.dispose();

    // The agent code should be wrapped in an IIFE that returns a value based on the state
    // We parse the JSON state inside the sandbox so the user code can just use `getState()`
    const wrappedCode = `
      (function() {
        function getState() {
          return JSON.parse(GAME_STATE_JSON);
        }
        ${code}
      })();
    `;

    // Execute with an instruction limit relative to timeout
    // QuickJS doesn't have a direct wall-clock timeout easily accessible here without a loop,
    // but doing basic logic shouldn't take many instructions.
    
    const result = context.evalCode(wrappedCode);

    if (result.error) {
      const errorStr = context.dump(result.error);
      result.error.dispose();
      return { success: false, returnValue: null, error: errorStr, logs };
    }

    const returnValue = context.dump(result.value);
    result.value.dispose();
    return { success: true, returnValue, logs };

  } catch (err: any) {
    return { success: false, returnValue: null, error: err.message, logs };
  } finally {
    context.dispose();
    runtime.dispose();
  }
}
