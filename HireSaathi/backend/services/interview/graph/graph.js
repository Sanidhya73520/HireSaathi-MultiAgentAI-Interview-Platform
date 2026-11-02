//                         START
//                           │
//                           ▼
//                   graph.invoke(state)
//                           │
//                           ▼
//                        Router
//                  Check state.action
//                           │
//              ┌────────────┴────────────┐
//              │                         │
//              ▼                         ▼
//       action="start"            action="feedback"
//              │                         │
//              ▼                         ▼
//       Interview Agent           Feedback Agent
//              │                         │
//              ▼                         ▼
//           Groq LLM                  Groq LLM
//              │                         │
//              ▼                         ▼
//      Generate Questions         Generate Feedback
//              │                         │
//              ▼                         ▼
//             END                  Feedback Router
//                                        │
//                              ┌─────────┴─────────┐
//                              │                   │
//                              ▼                   ▼
//                     completed=false      completed=true
//                              │                   │
//                              ▼                   ▼
//                             END             Summary Node
//                                                   │
//                                                   ▼
//                                             Summary Agent
//                                                   │
//                                                   ▼
//                                                Groq LLM
//                                                   │
//                                                   ▼
//                                             Final Report

import { END, START, StateGraph } from "@langchain/langgraph";
import InterviewState from "./state.js";
import { interviewNode, feedbackNode, summaryNode } from "./nodes.js";

function router(state) {
  switch (state.action) {
    case "start":
      return "interviewAgent";
    case "feedback":
      return "feedbackAgent";
    default:
      return END;
  }
}

function feedbackRouter(state) {
  if (state.completed) {
    return "summaryAgent";
  }
  return END;
}

const graph = new StateGraph(InterviewState)
  .addNode("interviewAgent", interviewNode)
  .addNode("feedbackAgent", feedbackNode)
  .addNode("summaryAgent", summaryNode)
  .addConditionalEdges(START, router, {
    interviewAgent: "interviewAgent",
    feedbackAgent: "feedbackAgent",
  })
  .addEdge("interviewAgent", END)
  .addConditionalEdges("feedbackAgent", feedbackRouter, {
    summaryAgent: "summaryAgent",
    [END]: END,
  })
  .addEdge("summaryAgent", END)
  .compile();

export default graph;
