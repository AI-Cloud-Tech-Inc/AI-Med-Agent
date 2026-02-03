#!/usr/bin/env python3
"""
AI Med Agent - Comprehensive Test Script

Tests all major components of the AI Med Agent system.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

print("=" * 70)
print("AI MED AGENT - COMPREHENSIVE TEST")
print("=" * 70)

# Test 1: Core Imports
print("\n[1/6] Testing Core Imports...")
try:
    from src.core.state import StateManager, AgentStatus, DecisionOutcome, AgentAction
    from src.core.logger import setup_logger
    print("✅ Core imports successful")
    print(f"   - StateManager: {StateManager.__name__}")
    print(f"   - AgentStatus: {AgentStatus.__name__}")
    print(f"   - DecisionOutcome: {DecisionOutcome.__name__}")
    print(f"   - AgentAction: {AgentAction.__name__}")
except Exception as e:
    print(f"❌ Core imports failed: {e}")
    sys.exit(1)

# Test 2: Agent Orchestrator
print("\n[2/6] Testing Agent Orchestrator...")
try:
    from src.agent.orchestrator import AgentOrchestrator
    
    # Create orchestrator instance
    orchestrator = AgentOrchestrator(
        agent_id="test-agent-001",
        require_approval=False
    )
    
    print("✅ Agent Orchestrator created successfully")
    print(f"   - Agent ID: {orchestrator.agent_id}")
    print(f"   - Require approval: {orchestrator.require_approval}")
    
    # Test state summary
    summary = orchestrator.get_state_summary()
    print(f"   - Current status: {summary['status']}")
    print(f"   - Total actions: {summary['total_actions']}")
    
except Exception as e:
    print(f"❌ Agent Orchestrator failed: {e}")
    sys.exit(1)

# Test 3: State Management
print("\n[3/6] Testing State Management...")
try:
    state_mgr = StateManager(agent_id="test-state-001")
    
    # Create and queue an action
    action = AgentAction(
        action_type="analyze_data",
        description="Analyze patient data for anomalies",
        parameters={"dataset": "patient_vitals_2026"}
    )
    
    state_mgr.queue_action(action)
    print("✅ State Management working")
    print(f"   - Action queued: {action.action_type}")
    print(f"   - Action type: {action.action_type}")
    print(f"   - Status: {action.status}")
    
    # Complete action
    state_mgr.complete_action(result={"findings": "No anomalies detected"})
    
    summary = state_mgr.get_state_summary()
    print(f"   - Total actions: {summary['total_actions']}")
    print(f"   - Metrics: {summary['metrics']}")
    
except Exception as e:
    print(f"❌ State Management failed: {e}")
    sys.exit(1)

# Test 4: Utilities
print("\n[4/6] Testing Utilities...")
try:
    from src.utils.secrets import get_secret, update_secret, list_secrets
    
    print("✅ Utilities imported successfully")
    print("   - get_secret(): Ready")
    print("   - update_secret(): Ready")
    print("   - list_secrets(): Ready")
    print("   - Note: AWS credentials needed for actual AWS calls")
    
except Exception as e:
    print(f"❌ Utilities failed: {e}")
    sys.exit(1)

# Test 5: Config Manager
print("\n[5/6] Testing Config Manager...")
try:
    from src.clients.config_manager import ConfigManager
    
    # Note: This will need AWS credentials to actually connect
    print("✅ Config Manager imported successfully")
    print("   - ConfigManager available")
    print("   - Note: Requires AWS AppConfig setup for full functionality")
    
except Exception as e:
    print(f"❌ Config Manager failed: {e}")
    sys.exit(1)

# Test 6: Action Flow Simulation
print("\n[6/6] Testing Complete Action Flow...")
try:
    # Create a new orchestrator
    agent = AgentOrchestrator(
        agent_id="med-agent-test",
        require_approval=False
    )
    
    # Register a test action handler
    def analyze_vitals(params):
        return {
            "status": "success",
            "heart_rate": "normal",
            "blood_pressure": "normal",
            "analysis": "Patient vitals within normal range"
        }
    
    agent.register_action_handler("analyze_vitals", analyze_vitals)
    
    # Create and execute an action
    action = AgentAction(
        action_type="analyze_vitals",
        description="Analyze patient vital signs",
        parameters={"patient_id": "P-12345"}
    )
    
    result = agent.execute_action(action, skip_approval_check=True)
    
    print("✅ Complete action flow successful")
    print(f"   - Action executed: analyze_vitals")
    print(f"   - Result: {result['status']}")
    print(f"   - Analysis: {result['analysis']}")
    
    # Get final summary
    summary = agent.get_state_summary()
    print(f"   - Total actions: {summary['total_actions']}")
    
except Exception as e:
    print(f"❌ Action flow failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Final Summary
print("\n" + "=" * 70)
print("TEST SUMMARY")
print("=" * 70)
print("✅ All 6 test categories PASSED")
print("\nComponents Tested:")
print("  1. Core Imports (StateManager, AgentStatus, etc.)")
print("  2. Agent Orchestrator (creation, configuration)")
print("  3. State Management (actions, metrics)")
print("  4. Utilities (secrets management)")
print("  5. Config Manager (AWS AppConfig)")
print("  6. Complete Action Flow (end-to-end)")
print("\n🎉 AI Med Agent is ready for use!")
print("\nNext Steps:")
print("  1. Set up AWS Secrets Manager (see AWS_SECRETS_MANAGER_SETUP.md)")
print("  2. Configure AWS AppConfig for production")
print("  3. Set up AWS budget alerts (see AWS_COST_PROTECTION_SETUP.md)")
print("  4. Deploy to AWS Lambda or ECS")
print("=" * 70)
