"""Script to fix import errors in AI Med Agent"""

# Fix src/core/__init__.py
init_content = '''"""Agent core modules"""

from src.core.logger import setup_logger
from src.core.state import StateManager, AgentStatus, DecisionOutcome, AgentAction

__all__ = ["setup_logger", "StateManager", "AgentStatus", "DecisionOutcome", "AgentAction"]
'''

with open('src/core/__init__.py', 'w', encoding='utf-8') as f:
    f.write(init_content)

print("✅ Fixed src/core/__init__.py")

# Verify the import works
try:
    from src.core import StateManager, AgentStatus, DecisionOutcome, AgentAction
    print("✅ All imports successful!")
    print(f"✅ StateManager: {StateManager}")
    print(f"✅ AgentStatus: {AgentStatus}")
    print(f"✅ DecisionOutcome: {DecisionOutcome}")
    print(f"✅ AgentAction: {AgentAction}")
except Exception as e:
    print(f"❌ Import failed: {e}")
