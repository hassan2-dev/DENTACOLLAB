const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const out = {
    media: await p.mediaAsset.count(),
    galleryAlbums: await p.galleryAlbum.count(),
    galleryMedia: await p.galleryMedia.count(),
    courses: await p.course.count(),
    publishedCourses: await p.course.count({ where: { status: 'PUBLISHED' } }),
    workshops: await p.calendarEvent.count(),
    visits: await p.siteVisit.count(),
    regs: await p.courseRegistration.count(),
    msgs: await p.contactMessage.count(),
    instructors: await p.instructor.count(),
    faq: await p.faq.count(),
    testimonials: await p.testimonial.count(),
  };
  console.log('COUNTS', JSON.stringify(out, null, 2));
  console.log(
    'COURSES',
    JSON.stringify(
      await p.course.findMany({ select: { title: true, slug: true, status: true, price: true } }),
      null,
      2,
    ),
  );
  console.log(
    'ALBUMS',
    JSON.stringify(await p.galleryAlbum.findMany({ select: { title: true, isPublished: true } }), null, 2),
  );
  console.log(
    'MEDIA',
    JSON.stringify(await p.mediaAsset.findMany({ select: { name: true, type: true, url: true }, take: 10 }), null, 2),
  );
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
