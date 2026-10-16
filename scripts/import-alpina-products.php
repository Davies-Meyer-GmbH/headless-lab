<?php
/** Product model and source-derived demo catalogue. Re-runs preserve editorial content. */
use Drupal\node\Entity\NodeType;
use Drupal\node\Entity\Node;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;
use Drupal\Core\Entity\Entity\EntityFormDisplay;
use Drupal\Core\Entity\Entity\EntityViewDisplay;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;

$root = dirname(DRUPAL_ROOT);
if (!NodeType::load('product')) NodeType::create(['type' => 'product', 'name' => 'Product', 'description' => 'Reusable Alpina product content for teasers, cards, and future product pages.', 'new_revision' => TRUE])->save();
$fields = [
  'field_product_code' => ['string', 'Product code', 1],
  'field_collection' => ['string', 'Product collection', 1],
  'field_summary' => ['string_long', 'Product summary', 1],
  'field_usps' => ['string', 'Product benefits', -1],
  'field_product_image' => ['image', 'Product image', 1],
  'field_teaser_image' => ['image', 'Teaser product image', 1],
  'field_product_link' => ['link', 'Product destination', 1],
];
$form = EntityFormDisplay::load('node.product.default') ?: EntityFormDisplay::create(['targetEntityType' => 'node', 'bundle' => 'product', 'mode' => 'default', 'status' => TRUE]);
$view = EntityViewDisplay::load('node.product.default') ?: EntityViewDisplay::create(['targetEntityType' => 'node', 'bundle' => 'product', 'mode' => 'default', 'status' => TRUE]);
$form->setComponent('title', ['type' => 'string_textfield', 'weight' => -10]);
$i=0;
foreach ($fields as $name => [$type, $label, $cardinality]) {
  if (!FieldStorageConfig::loadByName('node', $name)) FieldStorageConfig::create(['entity_type' => 'node', 'field_name' => $name, 'type' => $type, 'cardinality' => $cardinality, 'settings' => $type === 'image' ? ['target_type' => 'file'] : []])->save();
  if (!FieldConfig::loadByName('node','product',$name)) FieldConfig::create(['entity_type' => 'node', 'bundle' => 'product', 'field_name' => $name, 'label' => $label, 'required' => $name === 'field_product_code', 'settings' => match($type) {'image' => ['file_extensions' => 'png jpg jpeg webp', 'file_directory' => 'alpina/products', 'alt_field' => TRUE, 'alt_field_required' => TRUE], 'link' => ['link_type' => 17, 'title' => 0], default => []}])->save();
  $form->setComponent($name, ['type' => match($type) {'image'=>'image_image','string_long'=>'string_textarea','link'=>'link_default',default=>'string_textfield'}, 'weight'=>$i++]);
  $view->setComponent($name, ['type' => match($type) {'image'=>'image','link'=>'link',default=>'string'}, 'weight'=>$i, 'label'=>'above']);
}
$form->save();$view->save();
foreach (['administrator','content_editor'] as $role_id) {
  if ($role=\Drupal\user\Entity\Role::load($role_id)) {
    foreach (['create product content','edit any product content','delete any product content','view product revisions','revert product revisions'] as $permission) $role->grantPermission($permission);
    $role->save();
  }
}
function alpinaProductFile(string $filename): array {
  $uri='public://alpina/products/'.basename($filename);
  $storage=\Drupal::entityTypeManager()->getStorage('file');$files=$storage->loadByProperties(['uri'=>$uri]);$file=reset($files);
  if (!$file) {$file=\Drupal::service('file.repository')->writeData(file_get_contents(dirname(DRUPAL_ROOT).'/alpina-be-frontend/'.$filename),$uri,FileExists::Error);$file->setPermanent();$file->save();}
  return ['target_id'=>$file->id()];
}
$product_directory = 'public://alpina/products';
\Drupal::service('file_system')->prepareDirectory($product_directory,FileSystemInterface::CREATE_DIRECTORY|FileSystemInterface::MODIFY_PERMISSIONS);
$dom=new DOMDocument();@$dom->loadHTML(file_get_contents($root.'/alpina-be-frontend/products.html'));$xpath=new DOMXPath($dom);
$cards=$xpath->query('//section[contains(@class,"product-grid")]//a[contains(@class,"product-card")]');
$source=[];
foreach($cards as $card) {
  $title=trim(preg_replace('/\s+/u',' ',str_replace(['<br>','<br/>','<br />'],' ',$dom->saveHTML($xpath->query('.//h2',$card)->item(0)))));
  $title=html_entity_decode(strip_tags($title),ENT_QUOTES|ENT_HTML5,'UTF-8');
  $source[]=['title'=>$title,'collection'=>trim($xpath->query('.//p',$card)->item(0)->textContent),'image'=>$xpath->query('.//img',$card)->item(0)->getAttribute('src'),'usps'=>array_map(static fn($li)=>trim(ltrim($li->textContent,'∙')),iterator_to_array($xpath->query('.//li',$card)))];
}
$home=new DOMDocument();@$home->loadHTML(file_get_contents($root.'/alpina-be-frontend/index.html'));$hx=new DOMXPath($home);
$teasers=iterator_to_array($hx->query('//article[@class="full-width-teaser__item"]'));
$storage=\Drupal::entityTypeManager()->getStorage('node');$created=0;
for($index=0;$index<20;$index++) {
  $code=sprintf('ALPINA-DEMO-%02d',$index+1);
  if($storage->loadByProperties(['type'=>'product','field_product_code'=>$code]))continue;
  $data=$source[$index % count($source)];
  $name=$data['title'];$summary=implode('. ',$data['usps']).'.';$teaser_file=$data['image'];
  if($index < 2) {
    $name=trim($hx->query('.//h3',$teasers[$index])->item(0)->textContent);
    // The source gives both different products the same heading; retain it and disambiguate the second.
    if($index===1)$name.=' — Bad & Küche';
    $summary=trim($hx->query('.//p',$teasers[$index])->item(0)->textContent);
    $teaser_file=$hx->query('.//div[@class="full-width-teaser__product-img"]//img',$teasers[$index])->item(0)->getAttribute('src');
    $data['image']=$teaser_file;
    $data['collection']='ALPINAWEISS';
  } else {
    $data=$source[($index-2)%count($source)];$name=$data['title'];$summary=implode('. ',$data['usps']).'.';$teaser_file=$data['image'];
    if($index>=2+count($source))$name.=' — Demo '.($index+1);
  }
  Node::create(['type'=>'product','title'=>$name,'langcode'=>'en','uid'=>1,'status'=>1,'field_product_code'=>$code,'field_collection'=>$data['collection'],'field_summary'=>$summary,'field_usps'=>$data['usps'],'field_product_image'=>alpinaProductFile($data['image'])+['alt'=>$name],'field_teaser_image'=>alpinaProductFile($teaser_file)+['alt'=>$name],'field_product_link'=>['uri'=>'internal:#']])->save();$created++;
}
echo count($source)." source listing cards; created $created products; total ".count($storage->loadByProperties(['type'=>'product'])).".\n";
