# Agent Development Workflow Rules

## Breeth Architectural Memory Guidelines

- **Before Major Architectural Changes**: Retrieve relevant project design decisions and context from Breeth using the `search_graph` or `get_entity_view` MCP tools.
- **After Important Architectural Decisions**: Save the decision, context, and rationale to Breeth using `add_episode` or `record_fact`.

### Example Format for Saved Architectural Decisions:
- **Decision**: Use `MemoryService` abstraction layer in backend instead of direct provider calls.
- **Reasoning**: Keeps the interview engine provider-independent and makes future memory provider swapping clean and isolated.
