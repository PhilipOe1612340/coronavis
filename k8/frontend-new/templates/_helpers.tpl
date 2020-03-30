{{/* Generate basic labels */}}
{{- define "lingvis.labels" }}
deploymentName: {{ .Release.Name | quote }}
{{- end }}
{{- define "nginx.annotations" }}
{{- if eq .Values.environment "review" }}
{{- else }}
cert-manager.io/cluster-issuer: letsencrypt-production
{{- end }}
{{- end }}