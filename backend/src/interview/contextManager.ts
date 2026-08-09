import { Message, InterviewSession } from '../models/interfaces';

export class ContextManager {
  /**
   * Compiles conversation history and candidate context for LLM prompt generation.
   */
  public static buildContextPrompt(session: InterviewSession, candidateName: string, targetRole: string): string {
    let contextStr = `Candidate Name: ${candidateName}\nTarget Role: ${targetRole}\nCurrent Difficulty: ${session.difficulty}\n\nConversation History:\n`;
    
    session.messages.forEach((msg) => {
      contextStr += `[${msg.role.toUpperCase()}]: ${msg.content}\n`;
    });

    return contextStr;
  }

  public static appendMessage(session: InterviewSession, role: 'system' | 'user' | 'assistant', content: string): InterviewSession {
    const newMessage: Message = {
      role,
      content,
      timestamp: new Date().toISOString()
    };
    session.messages.push(newMessage);
    return session;
  }
}
