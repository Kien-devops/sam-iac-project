import React, { useState } from 'react';
import { Cpu, Server, Database, Mail, FileText, Send, Clock, Layers, ShieldCheck } from 'lucide-react';

export default function ArchDevOps() {
  const [selectedNode, setSelectedNode] = useState('Overview');

  const nodesInfo = {
    Overview: {
      title: "Decoupled Serverless & Containerized Architecture",
      desc: "Our platform leverages a modern hybrid architecture: a highly available ECS Fargate cluster handles the synchronous client interface and catalog API, while asynchronous events (invoices, emails) are decoupled via SNS/SQS queues and executed using AWS SAM Lambda functions.",
      specs: [
        "Infrastructure provisioned fully via declarative Terraform modules",
        "Decoupled publish-subscribe patterns prevent API blocking",
        "Stateless API endpoints scale automatically behind target groups"
      ]
    },
    ALB: {
      title: "Application Load Balancer (ALB)",
      desc: "Routes incoming secure HTTP traffic from client browsers using path-based rules. Distributes requests across ECS targets.",
      specs: [
        "Path rules: Routing `/api/*` to Backend Target Group, `/*` to Frontend",
        "Integrated AWS Certificate Manager SSL/TLS termination",
        "Automatic health checking of target Fargate tasks"
      ]
    },
    ECSFrontend: {
      title: "ECS Fargate: Frontend App Task",
      desc: "Containers running custom Nginx servers to deliver compiled Vite/React static assets with sub-millisecond edge response times.",
      specs: [
        "Built using optimized multi-stage Alpine Dockerfiles",
        "Zero-downtime rolling updates managed via ECS deployment parameters",
        "Direct static delivery with gzip compression enabled"
      ]
    },
    ECSBackend: {
      title: "ECS Fargate: Node.js Backend API",
      desc: "Synchronous REST API handling product updates, identity verification, catalog queries, and publishing order events.",
      specs: [
        "Express REST controller with structured logging middleware",
        "Secured AWS IAM execution policies for SQS/DynamoDB writes",
        "Seeded with resilient offline fallback handlers"
      ]
    },
    SNSTopic: {
      title: "Amazon SNS: Order Created Topic",
      desc: "Publishes high-throughput order event payloads instantly to multiple decoupled subscriber protocols.",
      specs: [
        "Event topic: `OrderCreatedTopic`",
        "Allows parallel execution of invoicing and reporting lambdas",
        "Strict JSON schema enforcement for event contracts"
      ]
    },
    SQSQueue: {
      title: "Amazon SQS: Order Processing Queue",
      desc: "Buffers messages securely before consumer Lambdas poll them, protecting serverless runtimes from sudden traffic spikes.",
      specs: [
        "Queue source: `OrderCreatedQueue`",
        "Supports dead-letter queues (DLQ) for failed message isolation",
        "Configured with 30-second visibility timeouts matching Lambdas"
      ]
    },
    LambdaInvoicing: {
      title: "AWS Lambda: Invoice Generator",
      desc: "Triggered by SQS. Generates secure, formatted PDF invoice documents for each order and stores them on Amazon S3.",
      specs: [
        "AWS SAM Serverless runtime using Node.js 20",
        "Direct programmatic stream writing to secure S3 bucket objects",
        "Optimized cold-start initialization parameters"
      ]
    },
    LambdaEmail: {
      title: "AWS Lambda: SES Dispatcher",
      desc: "Asynchronously compiles email templates and invokes Amazon SES to notify sandbox-verified customers.",
      specs: [
        "Dynamically templates customer names and pricing details",
        "Triggers SES API with transaction authorization signatures",
        "Handles sandbox verification bypass logic seamlessly"
      ]
    },
    S3Invoices: {
      title: "Amazon S3: Invoice Storage",
      desc: "Object storage bucket holding generated order invoice documents securely with KMS envelope encryption.",
      specs: [
        "Bucket: `sam-iac-project-invoices-dev`",
        "Managed lifecycle policies archive documents automatically to Glacier",
        "Encrypted at rest using SSE-S3 standard keys"
      ]
    }
  };

  return (
    <div className="admin-console-grid animate-fade-in">
      
      {/* Visual Diagram Panel */}
      <div className="bezel-shell lg:col-span-2">
        <div className="bezel-core p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <Layers size={16} className="text-primary animate-pulse" />
                AWS System Topology Visualizer
              </h3>
              <p className="section-subtitle">Click nodes to inspect technical specifications and IAM roles.</p>
            </div>
            <div className="flex gap-2">
              <span className="badge badge-success text-xxs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                ALB ONLINE
              </span>
            </div>
          </div>

          {/* Topology Interactive Layout */}
          <div className="topology-viewport flex flex-col gap-6 relative py-4">
            
            {/* Row 1: Client & Load Balancer */}
            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={() => setSelectedNode('Overview')}
                className={`node-box text-xs border border-dashed border-color px-4 py-2 rounded ${selectedNode === 'Overview' ? 'bg-primary text-black font-semibold' : 'bg-secondary'}`}
              >
                🌐 Client Web Browser (localhost:5173)
              </button>
              
              <div className="connector-vertical-dash h-6 bg-primary-soft"></div>
              
              <button 
                onClick={() => setSelectedNode('ALB')}
                className={`node-box text-xs py-3 px-6 rounded-lg text-center font-bold border flex items-center gap-2 ${selectedNode === 'ALB' ? 'border-primary bg-primary text-black' : 'border-color bg-tertiary text-primary'}`}
              >
                ⚖️ Application Load Balancer (ALB)
              </button>
            </div>

            {/* Split Route Lines */}
            <div className="relative w-full flex justify-center">
              <div className="w-1/2 border-t border-dashed border-color h-4"></div>
            </div>

            {/* Row 2: ECS Fargate Services */}
            <div className="grid grid-cols-2 gap-8 px-4">
              <button 
                onClick={() => setSelectedNode('ECSFrontend')}
                className={`node-box text-xs p-4 rounded-lg border text-left flex flex-col gap-1 transition-all ${selectedNode === 'ECSFrontend' ? 'border-primary bg-primary-soft shadow-glow-primary' : 'border-color bg-secondary'}`}
              >
                <span className="text-xxs font-mono text-secondary-soft">PATH: /*</span>
                <span className="font-bold flex items-center gap-1.5"><Server size={12} /> ECS Frontend Task</span>
                <span className="text-xxs text-secondary">React SPA (Nginx Container)</span>
              </button>

              <button 
                onClick={() => setSelectedNode('ECSBackend')}
                className={`node-box text-xs p-4 rounded-lg border text-left flex flex-col gap-1 transition-all ${selectedNode === 'ECSBackend' ? 'border-primary bg-primary-soft shadow-glow-primary' : 'border-color bg-secondary'}`}
              >
                <span className="text-xxs font-mono text-secondary-soft">PATH: /api/*</span>
                <span className="font-bold flex items-center gap-1.5"><Cpu size={12} className="text-primary" /> ECS Backend Task</span>
                <span className="text-xxs text-secondary">Express API (Products & Orders)</span>
              </button>
            </div>

            {/* Event Flow Pipeline (From Backend to SNS) */}
            <div className="flex justify-end pr-1/4 relative">
              <div className="absolute right-[25%] -top-1 bottom-0 flex flex-col items-center justify-center">
                <div className="connector-vertical-dash h-8 bg-emerald-500"></div>
                <span className="text-xxs text-emerald-400 font-mono scale-90 bg-tertiary px-1 border border-emerald-500/20 rounded">publish event</span>
                <div className="connector-vertical-dash h-4 bg-emerald-500"></div>
              </div>
            </div>
            
            {/* Row 3: SNS Topic */}
            <div className="grid grid-cols-2 gap-8 px-4 mt-8">
              <div></div>
              <button 
                onClick={() => setSelectedNode('SNSTopic')}
                className={`node-box text-xs p-4 rounded-lg border text-left flex flex-col gap-1 transition-all ${selectedNode === 'SNSTopic' ? 'border-emerald-500 bg-emerald-950/20 shadow-glow-emerald' : 'border-color bg-secondary'}`}
              >
                <span className="font-bold text-emerald-400 flex items-center gap-1.5"><Send size={12} /> Amazon SNS Topic</span>
                <span className="text-xxs text-secondary">Topic: OrderCreatedTopic</span>
              </button>
            </div>

            {/* SNS Subscription Arrow */}
            <div className="grid grid-cols-2 gap-8 px-4">
              <div></div>
              <div className="flex flex-col items-center">
                <div className="connector-vertical-dash h-4 bg-amber-500"></div>
                <span className="text-xxs text-amber-400 font-mono scale-90 bg-tertiary px-1 border border-amber-500/20 rounded">subscription</span>
                <div className="connector-vertical-dash h-4 bg-amber-500"></div>
              </div>
            </div>

            {/* Row 4: SQS Queue */}
            <div className="grid grid-cols-2 gap-8 px-4">
              <div></div>
              <button 
                onClick={() => setSelectedNode('SQSQueue')}
                className={`node-box text-xs p-4 rounded-lg border text-left flex flex-col gap-1 transition-all ${selectedNode === 'SQSQueue' ? 'border-amber-500 bg-amber-950/20 shadow-glow-amber' : 'border-color bg-secondary'}`}
              >
                <span className="font-bold text-amber-400 flex items-center gap-1.5"><Clock size={12} /> Amazon SQS Queue</span>
                <span className="text-xxs text-secondary">Queue: OrderCreatedQueue</span>
              </button>
            </div>

            {/* SQS Trigger Lambda split arrows */}
            <div className="grid grid-cols-2 gap-8 px-4">
              <div></div>
              <div className="flex flex-col items-center">
                <div className="connector-vertical-dash h-6 bg-violet-500"></div>
              </div>
            </div>

            {/* Row 5: AWS SAM Serverless Lambdas */}
            <div className="grid grid-cols-2 gap-4 px-4">
              <button 
                onClick={() => setSelectedNode('LambdaInvoicing')}
                className={`node-box text-xs p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${selectedNode === 'LambdaInvoicing' ? 'border-violet-500 bg-violet-950/20 shadow-glow-violet' : 'border-color bg-secondary'}`}
              >
                <span className="font-bold text-violet-400 flex items-center gap-1.5"><FileText size={12} /> Lambda Invoicing</span>
                <span className="text-xxs text-secondary">Trigger: SQS Order Event</span>
              </button>

              <button 
                onClick={() => setSelectedNode('LambdaEmail')}
                className={`node-box text-xs p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${selectedNode === 'LambdaEmail' ? 'border-violet-500 bg-violet-950/20 shadow-glow-violet' : 'border-color bg-secondary'}`}
              >
                <span className="font-bold text-violet-400 flex items-center gap-1.5"><Mail size={12} /> Lambda SES Mailer</span>
                <span className="text-xxs text-secondary">Trigger: SQS Order Event</span>
              </button>
            </div>

            {/* Storage & Outputs */}
            <div className="grid grid-cols-2 gap-4 px-4 mt-2">
              <button 
                onClick={() => setSelectedNode('S3Invoices')}
                className={`node-box text-xs p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${selectedNode === 'S3Invoices' ? 'border-color bg-tertiary' : 'border-color bg-secondary'}`}
              >
                <span className="font-bold text-secondary-soft flex items-center gap-1.5"><Database size={12} /> Amazon S3 Storage</span>
                <span className="text-xxs text-secondary">sam-iac-project-invoices-dev</span>
              </button>

              <div className="p-3 rounded-lg border border-dashed border-color bg-secondary text-left flex flex-col gap-1">
                <span className="font-bold text-secondary-soft flex items-center gap-1.5"><Mail size={12} /> AWS SES Sandbox</span>
                <span className="text-xxs text-secondary">Verified Customer Mailbox</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Specifications Node Detail Panel */}
      <div className="catalog-table-panel flex flex-col gap-4">
        <div>
          <h3 className="section-title">Component Inspector</h3>
          <p className="section-subtitle">Read live settings mapped from code templates.</p>
        </div>

        <div className="bezel-shell flex-1">
          <div className="bezel-core p-5 h-full flex flex-col gap-4">
            <div className="border-b border-color pb-3">
              <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                <Layers size={14} className="text-primary" />
                {nodesInfo[selectedNode].title}
              </h4>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              {nodesInfo[selectedNode].desc}
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <span className="text-xxs font-semibold uppercase tracking-wider text-secondary-soft">Provisioning Attributes:</span>
              <ul className="flex flex-col gap-2">
                {nodesInfo[selectedNode].specs.map((spec, i) => (
                  <li key={i} className="text-xs text-secondary flex items-start gap-2">
                    <ShieldCheck size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
