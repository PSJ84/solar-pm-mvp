// packages/prisma/seed.ts
import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. 회사 생성 (없으면 생성, 있으면 첫 번째 회사 사용)
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: '솔라에너지 주식회사',
      },
    });
    console.log('✅ Company created:', company.name);
  } else {
    console.log('ℹ️ Existing company found:', company.name);
  }

  // Budget 기본 카테고리 생성 (모든 회사 기준)
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });

  const defaultBudgetCategories = [
    { name: '구조물 자재/시공', vendorRole: 'structure', isDefault: true, order: 1 },
    { name: '전기공사', vendorRole: 'electrical', isDefault: true, order: 2 },
    { name: '전기설계', vendorRole: 'electrical_design', isDefault: true, order: 3 },
    { name: '구조검토', vendorRole: 'structural_review', isDefault: true, order: 4 },
    { name: 'EPC', vendorRole: 'epc', isDefault: true, order: 5 },
    { name: '유지보수', vendorRole: 'om', isDefault: true, order: 6 },
    { name: '금융비용', vendorRole: 'finance', isDefault: true, order: 7 },
    { name: '기타', vendorRole: 'other', isDefault: true, order: 8 },
  ];

  for (const targetCompany of companies) {
    await prisma.budgetCategory.createMany({
      data: defaultBudgetCategories.map((category) => ({ ...category, companyId: targetCompany.id })),
      skipDuplicates: true,
    });
    console.log(`✅ Default budget categories ensured for company: ${targetCompany.name}`);
  }

  // 2. 사용자 생성
  const adminExists = await prisma.user.findFirst({ where: { email: 'admin@solar-pm.com' } });
  if (!adminExists) {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@solar-pm.com',
        name: '관리자',
        role: 'admin',
        companyId: company.id,
      },
    });
    console.log('✅ Admin user created:', admin.name);
  }

  const pmExists = await prisma.user.findFirst({ where: { email: 'pm@solar-pm.com' } });
  let pm = pmExists;
  if (!pm) {
    pm = await prisma.user.create({
      data: {
        email: 'pm@solar-pm.com',
        name: '김태양 PM',
        role: 'manager',
        companyId: company.id,
      },
    });
    console.log('✅ PM user created:', pm.name);
  }

  if (!pm) {
    throw new Error('PM user could not be ensured for seeding');
  }

  // 3. 단계 템플릿 생성 (태양광 인허가 워크플로우)
  const stageTemplates = [
    { name: '사업타당성 검토', order: 1 },
    { name: '발전사업허가', order: 2 },
    { name: '개발행위허가', order: 3 },
    { name: '건축/공작물 허가', order: 4 },
    { name: '착공신고', order: 5 },
    { name: '전력수급계약', order: 6 },
    { name: '사용전검사', order: 7 },
    { name: '상업운전', order: 8 },
  ];

  for (const template of stageTemplates) {
    const stage = await prisma.stageTemplate.create({
      data: {
        name: template.name,
        order: template.order,
        companyId: company.id,
      },
    });

    // 각 단계별 기본 태스크 템플릿 생성
    const tasks = getTasksForStage(template.name);
    for (let i = 0; i < tasks.length; i++) {
      await prisma.taskTemplate.create({
        data: {
          title: tasks[i].title,
          isMandatory: tasks[i].isMandatory,
          defaultDueDays: tasks[i].defaultDueDays,
          order: i + 1,
          stageTemplateId: stage.id,
        },
      });
    }
  }
  console.log('✅ Stage templates created');

  // 4. 샘플 프로젝트 생성
  const project = await prisma.project.create({
    data: {
      name: '충남 서산 태양광 발전소',
      address: '충청남도 서산시 운산면',
      capacityKw: 998.5,
      status: 'in_progress',
      companyId: company.id,
    },
  });
  console.log('✅ Sample project created:', project.name);

  // 5. 프로젝트 단계 및 태스크 인스턴스 생성
  const stages = await prisma.stageTemplate.findMany({
    where: { companyId: company.id },
    include: { taskTemplates: true },
    orderBy: { order: 'asc' },
  });

  for (const stageTemplate of stages.slice(0, 4)) {
    const projectStage = await prisma.projectStage.create({
      data: {
        projectId: project.id,
        templateId: stageTemplate.id,
        status: stageTemplate.order <= 2 ? 'completed' : 'active',
        startedAt: new Date(),
      },
    });

    // 태스크 인스턴스 생성
    for (const taskTemplate of stageTemplate.taskTemplates) {
      const dueDate = new Date();
      if (taskTemplate.defaultDueDays) {
        dueDate.setDate(dueDate.getDate() + taskTemplate.defaultDueDays);
      } else {
        dueDate.setDate(dueDate.getDate() + 7); // 기본 7일
      }

      await prisma.task.create({
        data: {
          title: taskTemplate.title,
          isMandatory: taskTemplate.isMandatory,
          dueDate,
          status: stageTemplate.order <= 2 ? 'completed' : 'pending',
          projectStageId: projectStage.id,
          templateId: taskTemplate.id,
          assigneeId: pm.id,
        },
      });
    }
  }
  console.log('✅ Project stages and tasks created');

  // 6. 지연 위험 점수 샘플
  await prisma.delayRiskScore.create({
    data: {
      projectId: project.id,
      score: 35,
      severity: 'medium',
      overdueTaskCount: 2,
      upcomingTaskCount: 5,
      completionRate: 0.45,
      factors: ['2개 태스크 마감 초과', '이번 주 5개 태스크 예정'],
    },
  });
  console.log('✅ Risk score created');

  console.log('🎉 Seeding completed!');
}

function getTasksForStage(stageName: string) {
  const tasksByStage: Record<string, Array<{ title: string; isMandatory: boolean; defaultDueDays?: number }>> = {
    '사업타당성 검토': [
      { title: '부지 현장 조사', isMandatory: true },
      { title: '일사량 분석', isMandatory: true },
      { title: '계통연계 검토', isMandatory: true },
      { title: '사업성 분석 보고서', isMandatory: false },
    ],
    '발전사업허가': [
      { title: '발전사업허가 신청서 작성', isMandatory: true },
      { title: '사업계획서 제출', isMandatory: true },
      { title: '허가서 수령', isMandatory: true, defaultDueDays: 30 },
    ],
    '개발행위허가': [
      { title: '개발행위허가 신청', isMandatory: true },
      { title: '환경영향평가', isMandatory: false },
      { title: '농지전용 신청', isMandatory: false },
      { title: '산지전용 신청', isMandatory: false },
    ],
    '착공신고': [
      { title: '착공계 제출', isMandatory: true, defaultDueDays: -7 },
      { title: '공사업체 선정', isMandatory: true, defaultDueDays: -14 },
      { title: '안전관리계획서', isMandatory: true },
    ],
    '사용전검사': [
      { title: '전기안전검사 신청', isMandatory: true, defaultDueDays: -14 },
      { title: '사용전검사 신청', isMandatory: true, defaultDueDays: -7 },
      { title: '검사 완료 확인', isMandatory: true },
    ],
  };

  return tasksByStage[stageName] || [{ title: '기본 태스크', isMandatory: false }];
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
