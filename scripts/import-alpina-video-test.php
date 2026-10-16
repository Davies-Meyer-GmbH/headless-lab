<?php
/** Update image/video component contracts and create one separate video test page. */
use Drupal\canvas\Entity\JavaScriptComponent;
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\Page;
use Drupal\canvas_headless\ExternalComponentSync;
use Drupal\canvas_headless\FrontendUrl;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\File\FileExists;
use Symfony\Component\Yaml\Yaml;

$root=dirname(DRUPAL_ROOT);$definitions=[];
foreach(\Drupal::config('canvas_headless.settings')->get('frontends') as $frontend) {
  if($frontend['url']!=='http://localhost:3000')continue;
  foreach($frontend['components'] as $id) {
    $name=substr($id,3);$metadata=Yaml::parseFile("$root/frontend/components/$name/component.yml");$metadata['props']=$metadata['props']['properties'];$definitions[]=$metadata;
  }
}
$result=\Drupal::service(ExternalComponentSync::class)->synchronize(FrontendUrl::fromConfig('http://localhost:3000'),['version'=>1,'components'=>$definitions]);
if($result['errors'])throw new RuntimeException(implode("\n",$result['errors']));
echo 'Components: '.json_encode($result)."\n";
// Preserve all editorial input; only advance compatible component versions.
foreach(\Drupal::entityTypeManager()->getStorage('canvas_page')->loadMultiple() as $page) {
  $tree=$page->get('components')->getValue();$changed=FALSE;
  foreach($tree as &$item) {
    if(!in_array($item['component_id'],['js.alpina_hero','js.alpina_product_teaser'],TRUE))continue;
    $version=Component::load($item['component_id'])->getActiveVersion();
    if($item['component_version']!==$version){$item['component_version']=$version;$changed=TRUE;}
  }
  unset($item);
  if($changed){$page->set('components',$tree);$violations=$page->validate();if($violations->count())throw new RuntimeException((string)$violations);$page->save();}
}
$directory='public://alpina/video';\Drupal::service('file_system')->prepareDirectory($directory,FileSystemInterface::CREATE_DIRECTORY|FileSystemInterface::MODIFY_PERMISSIONS);
$media=[];
foreach(['video-a-d.mp4','video-a-m.mp4','video-b-d.mp4','video-b-m.mp4'] as $filename) {
  $uri="$directory/$filename";$files=\Drupal::entityTypeManager()->getStorage('file')->loadByProperties(['uri'=>$uri]);$file=reset($files);
  if(!$file){$file=\Drupal::service('file.repository')->writeData(file_get_contents("$root/alpina-be-frontend/assets/video/$filename"),$uri,FileExists::Error);$file->setPermanent();$file->save();}
  $name='Alpina '.$filename;$storage=\Drupal::entityTypeManager()->getStorage('media');$existing=$storage->loadByProperties(['bundle'=>'video','name'=>$name]);$entity=reset($existing);
  if(!$entity){$entity=$storage->create(['bundle'=>'video','name'=>$name,'langcode'=>'en','status'=>1,'uid'=>1,'field_media_video_file'=>['target_id'=>$file->id()]]);$violations=$entity->validate();if($violations->count())throw new RuntimeException((string)$violations);$entity->save();}
  $media[$filename]=$entity->id();
}
$storage=\Drupal::entityTypeManager()->getStorage('canvas_page');$existing=$storage->loadByProperties(['title'=>'Alpina video test']);$test=reset($existing);
if(!$test) {
  $source=Page::load(16);$tree=$source->get('components')->getValue();$uuid=\Drupal::service('uuid');$map=[];
  foreach($tree as $item)$map[$item['uuid']]=$uuid->generate();
  $teaser=0;
  foreach($tree as &$item) {
    $item['uuid']=$map[$item['uuid']];if($item['parent_uuid'])$item['parent_uuid']=$map[$item['parent_uuid']];
    $inputs=json_decode($item['inputs'],TRUE,512,JSON_THROW_ON_ERROR);
    if($item['component_id']==='js.alpina_hero'||$item['component_id']==='js.alpina_product_teaser') {
      $group='a';
      if($item['component_id']==='js.alpina_product_teaser')$group=++$teaser===1?'a':'b';
      $inputs['mediaType']='video';$inputs['desktopVideo']=['target_id'=>$media["video-$group-d.mp4"]];$inputs['mobileVideo']=['target_id'=>$media["video-$group-m.mp4"]];
      if($item['component_id']==='js.alpina_hero') {
        $dom=new DOMDocument();@$dom->loadHTML(file_get_contents("$root/alpina-be-frontend/index-video.html"));$x=new DOMXPath($dom);
        $inputs['heading']=$x->query('//section[@class="hero-header"]//h1')->item(0)->textContent;
      }
    }
    $item['inputs']=json_encode($inputs,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);
  }
  unset($item);
  $test=$storage->create(['title'=>'Alpina video test','status'=>1,'owner'=>1,'langcode'=>'en','page_variant'=>'alpina','components'=>$tree,'path'=>['alias'=>'/alpina-video-test']]);
  $violations=$test->validate();if($violations->count())throw new RuntimeException((string)$violations);$test->save();
}
echo "Video test page ID: {$test->id()}\nFrontend: http://localhost:3000/alpina-video-test\nEditor: https://headless-lab.local/canvas/editor/canvas_page/{$test->id()}\n";
