import { useState } from "react";

import type { ApiDocInterface, ApiDocParam } from "../lib/paymentApiDocs";

function ParamTable({ params }: { params: ApiDocParam[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50/50">
            <th className="px-4 py-3 text-left font-semibold text-stone-700">字段名</th>
            <th className="px-4 py-3 text-left font-semibold text-stone-700">变量名</th>
            <th className="px-4 py-3 text-left font-semibold text-stone-700">必填</th>
            <th className="px-4 py-3 text-left font-semibold text-stone-700">类型</th>
            <th className="px-4 py-3 text-left font-semibold text-stone-700">示例值</th>
            <th className="px-4 py-3 text-left font-semibold text-stone-700">描述</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param, index) => (
            <tr key={index} className="border-b border-stone-100 hover:bg-stone-50/50">
              <td className="px-4 py-3 font-medium text-stone-800">{param.fieldName}</td>
              <td className="px-4 py-3 font-mono text-stone-600">{param.variableName}</td>
              <td className="px-4 py-3">
                {param.required ? (
                  <span className="inline-flex items-center text-rose-600">
                    <span className="mr-1">是</span>
                    <span className="text-xs">*</span>
                  </span>
                ) : (
                  <span className="text-stone-500">否</span>
                )}
              </td>
              <td className="px-4 py-3 text-stone-600">{param.type}</td>
              <td className="px-4 py-3 font-mono text-xs text-stone-500">{param.example}</td>
              <td className="px-4 py-3 text-stone-600">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[24px] border border-stone-200 bg-white/80 overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-stone-50/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-stone-800">{title}</span>
        <svg
          className={`size-5 text-stone-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="border-t border-stone-200">{children}</div>}
    </div>
  );
}

export function ApiDocPanel({ apiDoc }: { apiDoc: ApiDocInterface }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-stone-200 bg-white/80 p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {apiDoc.method}
          </span>
          <span className="font-mono text-sm text-stone-600">{apiDoc.url}</span>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">{apiDoc.description}</p>
      </div>

      <CollapsibleSection title={apiDoc.request.title} defaultOpen={true}>
        <div className="p-4">
          <ParamTable params={apiDoc.request.params} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={apiDoc.response.title} defaultOpen={false}>
        <div className="p-4">
          <ParamTable params={apiDoc.response.params} />
        </div>
      </CollapsibleSection>

      {apiDoc.dataResponse && (
        <CollapsibleSection title={apiDoc.dataResponse.title} defaultOpen={false}>
          <div className="p-4">
            <ParamTable params={apiDoc.dataResponse.params} />
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

export function ApiDocSelector({
  apis,
  selectedApi,
  onSelect
}: {
  apis: ApiDocInterface[];
  selectedApi: ApiDocInterface;
  onSelect: (api: ApiDocInterface) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {apis.map((api) => {
        const isSelected = api.name === selectedApi.name;
        return (
          <button
            key={api.name}
            className={`rounded-[20px] px-4 py-2.5 text-sm font-medium transition ${
              isSelected
                ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10"
                : "bg-white/80 text-stone-700 hover:bg-white border border-stone-200"
            }`}
            onClick={() => onSelect(api)}
          >
            {api.name}
          </button>
        );
      })}
    </div>
  );
}

import { apiRulesDoc, orderStatusDoc, signAlgorithmDoc } from "../lib/paymentApiDocs";

export function ApiRulesPanel() {
  return (
    <div className="space-y-4">
      <CollapsibleSection title="接口规则" defaultOpen={false}>
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {apiRulesDoc.rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-3">
                <span className="font-medium text-stone-700">{rule.name}:</span>
                <span className="text-stone-600">{rule.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">参数规范：</span>
              {apiRulesDoc.paramRules[0].desc}
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="订单状态映射" defaultOpen={false}>
        <div className="p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {orderStatusDoc.map((status) => (
              <div key={status.code} className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
                <span className="rounded-lg bg-stone-200 px-2 py-1 text-xs font-semibold text-stone-700">
                  {status.code}
                </span>
                <span className="text-stone-700">{status.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="签名算法" defaultOpen={false}>
        <div className="p-4 space-y-4">
          <p className="text-sm text-stone-600">{signAlgorithmDoc.description}</p>
          
          {signAlgorithmDoc.steps.map((step) => (
            <div key={step.step} className="rounded-xl bg-stone-50 p-4">
              <h4 className="font-semibold text-stone-800 mb-2">
                第{step.step}步：{step.title}
              </h4>
              <p className="text-sm text-stone-600 mb-3">{step.content}</p>
              {step.rules && (
                <ul className="space-y-1.5">
                  {step.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-stone-600">
                      <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="rounded-xl border border-stone-200 p-4">
            <h4 className="font-semibold text-stone-800 mb-3">签名示例</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-stone-700">待签名值（stringA）:</span>
                <code className="mt-1 block rounded-lg bg-stone-100 p-2 font-mono text-xs text-stone-600 break-all">
                  {signAlgorithmDoc.example.stringA}
                </code>
              </div>
              <div>
                <span className="font-medium text-stone-700">拼接密钥后（stringSignTemp）:</span>
                <code className="mt-1 block rounded-lg bg-stone-100 p-2 font-mono text-xs text-stone-600 break-all">
                  {signAlgorithmDoc.example.stringSignTemp}
                </code>
              </div>
              <div>
                <span className="font-medium text-stone-700">签名结果（signValue）:</span>
                <code className="mt-1 block rounded-lg bg-emerald-50 p-2 font-mono text-xs text-emerald-700">
                  {signAlgorithmDoc.example.signValue}
                </code>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
