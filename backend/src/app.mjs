import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SFNClient, StartSyncExecutionCommand } from "@aws-sdk/client-sfn";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const db = new DynamoDBClient({}), sfn = new SFNClient({}), br = new BedrockRuntimeClient({}), ses = new SESv2Client({});
const { TABLE, FLOW_ARN, OWNER, MODEL_ID } = process.env;

const FACTS = `You are the code reviewer on Akash Goswami's portfolio, answering questions about Akash. Use ONLY these facts. If something is not covered, say Akash can answer by email. Keep answers under 80 words, plain text, no em dashes.
Facts: Akash is a final year B.Tech CSE student at NIT Warangal (graduating May 2027) and a US citizen who needs no visa sponsorship. He was a Software Developer Intern at AVEVA, Hyderabad (Jun to Aug 2026), has a return offer, and interns there again Jan to Jul 2027. He wants a US software engineering job from Aug 2027.
At AVEVA he built DocAnalytics, a multi-tenant document-processing analytics platform with .NET 10, Angular 22, PostgreSQL and EF Core, with strict tenant isolation. He shipped AI invoice extraction using AWS Bedrock and S3 (about 98% confidence via subtotal and total reconciliation), GuardDuty malware scanning, Terraform on AWS (ECS, ALB, RDS, ECR), CI gated on coverage, gitleaks and Trivy, TDD with xUnit and Vitest, and JMeter load tests (sub 3 second responses, 0% errors at 1M+ records).
Other work: Twizz, a Discord job-alert bot used by 7000+ people on 4 continents (Python, Tesseract OCR, Docker, EC2, CloudWatch, Lambda); CryptoHunt, a Linux emulator CTF at Technozion 24; an SQL investment portfolio system. Open source: Hacktoberfest 2025 Super Contributor (6+ PRs merged) and a merged Kestra plugin-github PR (GitHub Actions run status, wait and trigger tasks) in Hacktoberfest 2026. He won a $100 HackClub grant for a custom PCB, and took 2nd place at HackQE 2021 with OxyMap. He is Additional Secretary of the CSE Society at NIT Warangal.
Languages: C++, C#, C, Python, Java, TypeScript, SQL.`;

const json = (code, body) => ({ statusCode: code, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export const handler = async (event) => {
  let b = {};
  try { b = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "bad json" }); }
  const path = event.rawPath || "";
  try {
    if (path.endsWith("/ask")) {
      const q = String(b.q || "").slice(0, 300).trim();
      if (!q) return json(400, { error: "empty question" });
      const r = await br.send(new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: FACTS }],
        messages: [{ role: "user", content: [{ text: q }] }],
        inferenceConfig: { maxTokens: 250, temperature: 0.3 },
      }));
      return json(200, { a: r.output.message.content[0].text });
    }
    if (path.endsWith("/merge")) {
      const r = await sfn.send(new StartSyncExecutionCommand({ stateMachineArn: FLOW_ARN, input: "{}" }));
      if (r.status !== "SUCCEEDED") return json(500, { error: "workflow failed" });
      return json(200, { count: Number(JSON.parse(r.output).count), status: "Succeeded." });
    }
    if (path.endsWith("/contact")) {
      const name = String(b.name || "").slice(0, 80).trim(), email = String(b.email || "").slice(0, 120).trim(), message = String(b.message || "").slice(0, 1000).trim();
      if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { error: "invalid input" });
      await db.send(new PutItemCommand({ TableName: TABLE, Item: { pk: { S: "contact" }, sk: { S: new Date().toISOString() }, name: { S: name }, email: { S: email }, message: { S: message } } }));
      await ses.send(new SendEmailCommand({
        FromEmailAddress: OWNER,
        Destination: { ToAddresses: [OWNER] },
        ReplyToAddresses: [email],
        Content: { Simple: { Subject: { Data: "Portfolio message from " + name.replace(/[\r\n]/g, " ") }, Body: { Text: { Data: message + "\n\nFrom: " + name + " <" + email + ">" } } } },
      }));
      return json(200, { ok: true });
    }
    return json(404, { error: "not found" });
  } catch (e) {
    console.error(e);
    return json(500, { error: "server error" });
  }
};
