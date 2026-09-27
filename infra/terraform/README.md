# Infraestrutura (Terraform)

Esqueleto da infraestrutura AWS do EventFlow para o **AWS Academy Learner Lab**. Hoje cria a rede (VPC, subnets públicas/privadas, rotas, endpoints de S3/DynamoDB); os demais recursos entram na fase 3 do roadmap.

```bash
# credenciais do lab: "AWS Details" → ~/.aws/credentials (expiram com a sessão)
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
terraform destroy   # ao fim de cada sessão de testes, para poupar créditos
```

| Arquivo        | Conteúdo                                                         |
| -------------- | ---------------------------------------------------------------- |
| `versions.tf`  | Versões do Terraform e do provider AWS                           |
| `providers.tf` | Provider AWS (região e tags padrão)                              |
| `variables.tf` | Variáveis de entrada                                             |
| `iam.tf`       | `LabInstanceProfile` (o Learner Lab não permite criar IAM roles) |
| `network.tf`   | VPC, subnets em 2 AZs, internet gateway, rotas, VPC endpoints    |
| `outputs.tf`   | IDs usados pelos próximos módulos                                |

**Próximos arquivos (fase 3):** `security.tf` (security groups ALB → EC2 → RDS/Redis), `rds.tf`, `elasticache.tf`, `s3.tf`, `dynamodb.tf`, `messaging.tf` (SNS + SQS + DLQ + assinaturas com filter policy), `ecr.tf`, `alb.tf`, `asg.tf` (launch template com detailed monitoring, ASG 1–3, alarmes de CPU 70%/25%), `worker.tf` e `templates/user-data.sh.tftpl`.
